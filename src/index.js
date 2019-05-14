/** @module jaidbot */

import ChatClient from "twitch-chat-client"
import twitch from "twitch"
import got from "got"
import openurl2 from "openurl2"

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
  // const token = await twitch.getAppAccessToken(process.env.TWITCH_STREAMER_CLIENT_ID, process.env.TWITCH_STREAMER_CLIENT_SECRET)
  // const streamerClient = await twitch.withCredentials(process.env.TWITCH_STREAMER_CLIENT_ID, token)
  const streamerClient = await twitch.withCredentials(process.env.TWITCH_STREAMER_CLIENT_ID, process.env.TWITCH_STREAMER_TOKEN, streamerScopes)
  const chatClient = await ChatClient.forTwitchClient(botClient)
  await chatClient.connect()
  await chatClient.waitForRegistration()
  await chatClient.join("jaidchen")
  const say = message => chatClient.say("jaidchen", message)
  say("Da bin ich!")
  const listener = chatClient.onPrivmsg(async (channel, user, message, msg) => {
    handleMessage(message, msg, streamerClient, botClient, chatClient, say)
  })
}

job()