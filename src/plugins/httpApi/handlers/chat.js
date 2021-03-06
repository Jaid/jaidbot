import {isEmpty} from "has-content"

import twitch from "src/plugins/twitch"

/**
 * @type {import("koa").Middleware}
 */
const middleware = async context => {
  const message = context.request.fields?.message
  if (isEmpty(message)) {
    context.throw(400, "No chat message given")
  }
  twitch.streamerChatClient.say(twitch.streamerLogin, message)
}

export default middleware