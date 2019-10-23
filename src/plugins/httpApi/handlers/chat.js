import twitch from "src/twitch"

/**
 * @type {import("koa").Middleware}
 */
const middleware = async context => {
  twitch.say("")
  context.body = ""
}

export default middleware