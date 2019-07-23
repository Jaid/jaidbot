import EventEmitter from "events"

import ChatClient from "twitch-chat-client"
import logger from "lib/logger"
import config from "lib/config"
import moment from "lib/moment"
import TwitchUser from "src/models/TwitchUser"

import ChatBot from "./ChatBot"

class TwitchCore extends EventEmitter {

  async init() {
    const [streamerUser, botUser] = await Promise.all([
      TwitchUser.getByTwitchLogin(config.twitchStreamerLogin),
      TwitchUser.getByTwitchLogin(config.twitchBotLogin),
    ])
    this.streamerUser = streamerUser
    this.botUser = botUser
    if (!streamerUser?.accessToken) {
      logger.warn("No user auth found for requested streamer user %s", config.twitchStreamerLogin)
      return false
    }
    if (!botUser?.accessToken) {
      logger.warn("No user auth found for requested bot user %s", config.twitchBotLogin)
      return false
    }
    const [streamerClient, botClient] = await Promise.all([
      streamerUser.toTwitchClient(),
      botUser.toTwitchClient(),
    ])
    this.streamerClient = streamerClient
    this.botClient = botClient
    const chatClient = await ChatClient.forTwitchClient(botClient)
    this.chatClient = chatClient
    await chatClient.connect()
    await chatClient.waitForRegistration()
    await chatClient.join(this.streamerUser.getDisplayName())
    logger.info("Connected bot")
    this.chatBot = new ChatBot()
    chatClient.onPrivmsg((channel, user, message, msg) => {
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
      this.chatBot.handleMessage(messageInfo)
    })
  }

  async userNameToDisplayName(userName) {
    const profile = await this.streamerClient.helix.users.getUserByName(userName)
    return profile?.displayName || profile?.name || userName
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

}

export default new TwitchCore