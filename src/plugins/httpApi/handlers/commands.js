import twitch from "src/plugins/twitch"

/**
 * @type {import("koa").Middleware}
 */
const middleware = async context => {
  context.body = twitch.chatBot.commandUsages
}

export default middleware