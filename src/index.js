/** @module jaidbot */

import ChatClient from "twitch-chat-client"
import twitch from "twitch"

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
  const botClient = await twitch.withCredentials(process.env.TWITCH_BOT_CLIENT_ID, process.env.TWITCH_BOT_TOKEN)
  const streamerClient = await twitch.withCredentials(process.env.TWITCH_STREAMER_CLIENT_ID, process.env.TWITCH_STREAMER_TOKEN, streamerScopes)
  const chatClient = await ChatClient.forTwitchClient(botClient)
  await chatClient.connect()
  await chatClient.waitForRegistration()
  await chatClient.join("jaidchen")
  const say = message => chatClient.say("jaidchen", message)
  say("TBAngel Da bin ich!")
  const listener = chatClient.onPrivmsg(async (channel, user, message, msg) => {
    handleMessage(message, msg, streamerClient, botClient, chatClient, say)
  })
  npmReleaseNotifier(say)
}

job()