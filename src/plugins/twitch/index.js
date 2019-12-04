import capitalize from "capitalize"
import delay from "delay"
import EventEmitter from "events"
import {isEmpty} from "has-content"
import ms from "ms.macro"
import Cache from "node-cache"
import pRetry from "p-retry"
import readableMs from "readable-ms"
import twitch from "twitch"

import isOnlyDigits from "lib/isOnlyDigits"
import moment from "lib/moment"

import {logger} from "src/core"
import Heartbeat from "src/models/Heartbeat"
import TwitchUser from "src/models/TwitchUser"
import apiServer from "src/plugins/apiServer"

import ChatBot from "./ChatBot"

function removeTitlePrefix(title) {
  return title.replace(/^\s*\[.*]\s*/, "")
}

class Twitch extends EventEmitter {

  isInAdLoop = false

  currentTitle = null

  /**
   * @param {import("src/core").Config} config
   */
  handleConfig(config) {
    this.nicknames = config.nicknames || {}
    this.streamerLogin = config.twitchStreamerLogin
    this.botLogin = config.twitchBotLogin
    this.predefinedStreamerAccessToken = config.twitchStreamerAccessToken
    this.predefinedStreamerRefreshToken = config.twitchStreamerRefreshToken
    this.predefinedBotAccessToken = config.twitchBotAccessToken
    this.predefinedBotRefreshToken = config.twitchBotRefreshToken
    this.clientId = config.twitchClientId
    this.clientSecret = config.twitchClientSecret
    this.tickMs = config.twitchTickSeconds * ms`1 second`
    this.nicknameCache = new Cache({
      stdTTL: ms`1 day` / 1000,
    })
  }

  /**
   * @type {boolean}
   */
  isReady = false

  currentTitle = null

  async init() {
    await delay(10000)
    this.apiClient = await twitch.withClientCredentials(this.clientId, this.clientSecret)
    const twitchUserPrefixes = ["streamer", "bot"]
    for (const prefix of twitchUserPrefixes) {
      const prefixCapitalized = capitalize(prefix)
      const login = this[`${prefix}Login`]
      logger.info("Preparing %s Twitch account (%s)", prefix, login)
      const user = await TwitchUser.findOrRegisterByLogin(login)
      if (!user.accessToken && this[`predefined${prefixCapitalized}AccessToken`]) {
        user.accessToken = this[`predefined${prefixCapitalized}AccessToken`]
        logger.info("Set Twitch %s accessToken from config", prefix)
      }
      if (!user.refreshToken && this[`predefined${prefixCapitalized}RefreshToken`]) {
        user.refreshToken = this[`predefined${prefixCapitalized}RefreshToken`]
        logger.info("Set Twitch %s refreshToken from config", prefix)
      }
      await user.save()
      if (!user?.accessToken) {
        logger.warn("No user auth found for requested streamer user %s", this.streamerLogin)
        return false
      }
      this[`${prefix}User`] = user
      this[prefix] = await user.toTwitchClientWithChat()
      this[`${prefix}Client`] = this[prefix].apiClient
    }
    const myKrakenChannel = await this.streamerClient.kraken.channels.getMyChannel()
    this.streamerTwitchId = myKrakenChannel.id
    this.currentTitle = myKrakenChannel.status
    const normalizedTitle = removeTitlePrefix(this.currentTitle)
    if (this.currentTitle !== normalizedTitle) {
      logger.debug("The initial stream title had a prefix, removing it because it is most likely outdated")
      this.setTitle(normalizedTitle)
    }
    logger.info("Initial stream title: %s", this.currentTitle)
    this.streamerChatClient = this.streamer.chatClient
    this.chatClient = this.bot.chatClient
    await this.chatClient.join(this.streamerLogin)
    logger.info("Connected bot")
    this.chatBot = new ChatBot()
    this.chatClient.onPrivmsg(async (channel, user, message, msg) => {
      const messageInfo = {
        text: message.trim(),
        bits: msg.totalBits || 0,
        sender: {
          id: msg.userInfo.userId,
          name: msg.userInfo.userName,
          isBroadcaster: msg.userInfo.badges.get("broadcaster") === "1",
          isVip: msg.userInfo.badges.get("vip") === "1",
          isMod: msg.userInfo.isMod,
          isSub: msg.userInfo.isSubscriber,
          color: msg.userInfo.color,
        },
      }
      messageInfo.sender.displayName = msg.userInfo.displayName || messageInfo.sender.name
      messageInfo.sender.hasElevatedPermission = Boolean(msg.userInfo.userType) || messageInfo.sender.isBroadcaster
      if (msg.userInfo._userData.has("tmi-sent-ts")) { // eslint-disable-line no-underscore-dangle
        messageInfo.sentDate = new Date(Number(msg.userInfo._userData.get("tmi-sent-ts"))) // eslint-disable-line no-underscore-dangle
      }
      logger.debug(`${messageInfo.sender.displayName}: ${messageInfo.text}`)
      this.emit("chat", messageInfo)
      await this.chatBot.handleMessage(messageInfo)
    })
    this.isReady = true
    this.say("TBAngel Da bin ich!")
  }

  async userNameToDisplayName(userName) {
    const profile = await this.apiClient.helix.users.getUserByName(userName)
    return profile?.displayName || profile?.name || userName
  }

  async getNickname(usernameOrTwitchId) {
    try {
      const normalizedUsername = String(usernameOrTwitchId).trim().toLowerCase()
      const cachedName = this.nicknameCache.get(normalizedUsername)
      if (cachedName) {
        return cachedName
      }
      const customNickname = this.nicknames[normalizedUsername]
      if (customNickname) {
        this.nicknameCache.set(normalizedUsername, customNickname)
        return customNickname
      }
      const isTwitchId = isOnlyDigits(usernameOrTwitchId)
      let username
      let profile
      if (isTwitchId) {
        profile = await this.apiClient.helix.users.getUserById(normalizedUsername)
        if (profile) {
          username = profile.name
          const customNicknameById = this.nicknames[username]
          if (customNicknameById) {
            this.nicknameCache.set(username, customNicknameById)
            return customNicknameById
          }
        }
      }
      if (!profile) {
        username = normalizedUsername
        profile = await this.apiClient.helix.users.getUserByName(username)
      }
      const name = profile?.displayName || profile?.name || normalizedUsername
      this.nicknameCache.set(username, name)
      return name
    } catch (error) {
      logger.error(`Could not fetch nickname for "${usernameOrTwitchId}"\n%s`, error)
      return "(?)"
    }
  }

  async playAd(adDurationSeconds = 30) {
    const job = async () => {
      await this.streamerClient.kraken.channels.startChannelCommercial(this.streamerUser.twitchId, adDurationSeconds)
    }
    try {
      await pRetry(job, {
        maxTimeout: ms`5 seconds`,
        minTimeout: 100,
      })
      logger.debug("Started %s ad", readableMs(adDurationSeconds * 1000))
    } catch (error) {
      logger.error("Could not play %ss ad\n%s", adDurationSeconds, error)
    }
  }

  async startAdLoop() {
    this.isInAdLoop = true
    while (this.isInAdLoop) {
      await this.playAd(180)
      await delay(ms`8 minutes`)
    }
  }

  async stopAdLoop() {
    this.isInAdLoop = false
  }

  async getFollowMoment(userName) {
    const user = await this.apiClient.helix.users.getUserByName(userName)
    const followResult = await user.getFollowTo(this.streamerUser.twitchId)
    if (followResult === null) {
      return false
    }
    return moment(followResult.followDate)
  }

  async getMyStream() {
    return this.streamerClient.kraken.streams.getStreamByChannel(this.streamerUser.twitchId)
  }

  async setCategory(game) {
    await this.streamerClient.kraken.channels.updateChannel(this.streamerUser.twitchId, {game})
  }

  /**
   * @async
   * @function
   * @param {string} twitchId
   * @return {Promise<import("twitch").HelixUser>}
   */
  async getUserInfoByTwitchId(twitchId) {
    const helixUser = await this.apiClient.helix.users.getUserById(twitchId)
    return helixUser
  }

  /**
   * @async
   * @function
   * @param {string} twitchLogin
   * @return {Promise<import("twitch").HelixUser>}
   */
  async getUserInfoByTwitchLogin(twitchLogin) {
    const helixUser = await this.apiClient.helix.users.getUserByName(twitchLogin)
    return helixUser
  }

  async setTitle(title) {
    const newTitle = String(title).trim()
    if (newTitle === this.currentTitle) {
      logger.debug("Not overwriting stream title, it has not changed")
      return
    }
    this.currentTitle = newTitle
    logger.info("New stream title: %s", newTitle)
    await this.streamerClient.kraken.channels.updateChannel(this.streamerUser.twitchId, {
      status: newTitle,
    })
  }

  say(message) {
    if (!this.chatClient) {
      logger.warn("Tried to say \"%s\", but chatClient was %s", message, this.chatClient)
      return
    }
    this.chatClient.say(this.streamerUser.loginName, message)
  }

  isPlayingGame(game) {
    if (!Heartbeat.currentStatus) {
      return false
    }
    if (isEmpty(Heartbeat.currentStatus.game)) {
      return false
    }
    return Heartbeat.currentStatus.game.toLowerCase() === game.toLowerCase()
  }

  isLastGame(game) {
    if (!Heartbeat.lastTwitchStatus) {
      return false
    }
    if (isEmpty(Heartbeat.lastTwitchStatus.game)) {
      return false
    }
    return Heartbeat.lastTwitchStatus.game.toLowerCase() === game.toLowerCase()
  }

  notifyIfGame(game, message) {
    if (this.isLastGame(game)) {
      this.say(`HumbleLife ${message}`)
    }
  }

  notifyIfGameLive(game, message) {
    if (this.isPlayingGame(game)) {
      this.say(`HumbleLife ${message}`)
    }
  }

  ready() {
    if (this.tickMs) {
      this.tickInterval = setInterval(this.tick.bind(this), this.tickMs)
    } else {
      logger.warn("Not starting Twitch ticking, because config.twitchTickSeconds is not given")
    }
  }

  getTitleWithoutPrefix() {
    return removeTitlePrefix(this.currentTitle)
  }

  async tick() {
    const tickStart = Date.now()
    try {
      const fetchChattersStart = Date.now()
      const chatters = await this.botClient.unsupported.getChatters(this.streamerLogin)
      logger.debug("Fetched %s chatters in %s", chatters.allChatters.length, readableMs(Date.now() - fetchChattersStart))
      for (const [chatter, role] of chatters.allChattersWithStatus.entries()) {
        const twitchUser = await TwitchUser.findOrRegisterByLogin(chatter, {
          defaults: {
            chatterRole: role,
          },
        })
        if (twitchUser.chatterRole !== role) {
          logger.info("Changed chatter role of %s from %s to %s", twitchUser.getDisplayName(), twitchUser.chatterRole, role)
          twitchUser.chatterRole = role
        }
        await twitchUser.save()
      }
      if (apiServer.hasClient()) {
        apiServer.client.emit("updateChatters", chatters.allChattersWithStatus)
      }
      logger.debug("Twitch tick done in %s", readableMs(Date.now() - tickStart))
    } catch (error) {
      logger.error("Twitch tick failed: %s", error)
    }
  }

}

export default new Twitch

export {removeTitlePrefix}