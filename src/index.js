/** @module jaidbot */

import ChatClient from "twitch-chat-client"
import twitch from "twitch"

import handleMessage from "./handleMessage"

const job = async () => {
  console.log(process.env.TWITCH_BOT_CLIENT_ID)
  const twitchClient = await twitch.withCredentials(process.env.TWITCH_BOT_CLIENT_ID, process.env.TWITCH_BOT_TOKEN)
  const chatClient = await ChatClient.forTwitchClient(twitchClient)
  await chatClient.connect()
  await chatClient.waitForRegistration()
  await chatClient.join("jaidchen")
  const say = message => chatClient.say("jaidchen", message)
  const listener = chatClient.onPrivmsg(async (channel, user, message, msg) => {
    handleMessage(message, msg, chatClient, say)
  })
}

job()