import EventEmitter from "events"

import {logger} from "src/core"
import moment from "lib/moment"
import TwitchUser from "src/models/TwitchUser"
import Heartbeat from "src/models/Heartbeat"
import isOnlyDigits from "lib/isOnlyDigits"
import Cache from "node-cache"
import ms from "ms.macro"
import pRetry from "p-retry"
import readableMs from "readable-ms"
import delay from "delay"
import {isEmpty} from "has-content"

import ChatBot from "./ChatBot"

class Twitch extends EventEmitter {

  isInAdLoop = false

  handleConfig(config) {
    this.nicknames = config.nicknames || {}
    this.nicknameCache = new Cache({
      stdTTL: ms`1 day` / 1000,
    })
    this.streamerLogin = config.twitchStreamerLogin
    this.botLogin = config.twitchBotLogin
  }

  /**
   * @type {boolean}
   */
  isReady = false

  async init() {
    const [streamerUser, botUser] = await Promise.all([
      TwitchUser.getByTwitchLogin(this.streamerLogin),
      TwitchUser.getByTwitchLogin(this.botLogin),
    ])
    this.streamerUser = streamerUser
    this.botUser = botUser
    if (!streamerUser?.accessToken) {
      logger.warn("No user auth found for requested streamer user %s", this.streamerLogin)
      return false
    }
    if (!botUser?.accessToken) {
      logger.warn("No user auth found for requested bot user %s", this.botLogin)
      return false
    }
    const [streamer, bot] = await Promise.all([
      streamerUser.toTwitchClientWithChat(),
      botUser.toTwitchClientWithChat(),
    ])
    this.streamerClient = streamer.apiClient
    this.streamerChatClient = streamer.chatClient
    this.botClient = bot.apiClient
    this.chatClient = bot.chatClient
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
    const profile = await this.streamerClient.helix.users.getUserByName(userName)
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
        profile = await this.streamerClient.helix.users.getUserById(normalizedUsername)
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
        profile = await this.streamerClient.helix.users.getUserByName(username)
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
    const user = await this.streamerClient.helix.users.getUserByName(userName)
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
  async getChannelInfo(twitchId) {
    const helixUser = await this.streamerClient.helix.users.getUserById(twitchId)
    return helixUser
  }

  async setTitle(title) {
    await this.streamerClient.kraken.channels.updateChannel(this.streamerUser.twitchId, {
      status: title.trim(),
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
    debugger
    this.tickInterval = setInterval(this.tick.bind(this), ms`5 second`)
  }

  async tick() {
    try {
      logger.info("TICK")
      const viewers = await this.botClient.unsupported.getChatters(this.streamerLogin)
      debugger
    } catch (error) {
      logger.error("Twitch tick failed: %s", error)
    }
  }

}

export default new Twitch