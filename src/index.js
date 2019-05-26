/** @module jaidbot */

import ChatClient from "twitch-chat-client"
import twitch from "twitch"
import afkManager from "lib/afkManager"
import {log} from "lib/logger"
import config from "lib/config"

import npmReleaseNotifier from "./npmReleaseNotifier"
import handleMessage from "./handleMessage"

const streamerScopes = [
  "user:edit:broadcast",
  "user:edit",
  "channel:read:subscriptions",
  "user:read:broadcast",
  "channel_editor",
  "channel_read",
]

const job = async () => {
  const [botClient, streamerClient] = await Promise.all([
    twitch.withCredentials(config.twitchBotClient.id, config.twitchBotClient.token),
    twitch.withCredentials(config.twitchApiClient.id, config.twitchApiClient.token, streamerScopes),
  ])
  log("Initialized Twitch clients")
  const chatClient = await ChatClient.forTwitchClient(botClient)
  await chatClient.connect()
  await chatClient.waitForRegistration()
  await chatClient.join(config.twitchChannel)
  const say = message => chatClient.say(config.twitchChannel, message)
  afkManager.init(streamerClient, say)
  log("Connected bot")
  say("TBAngel Da bin ich!")
  const listener = chatClient.onPrivmsg(async (channel, user, message, msg) => {
    handleMessage(message, msg, streamerClient, botClient, chatClient, say)
  })
  npmReleaseNotifier(say)
}

job()