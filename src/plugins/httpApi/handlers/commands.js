import twitch from "src/plugins/twitch"

/**
 * @type {import("koa").Middleware}
 */
const middleware = async (context, next, password) => {
  await next()
}

export default async (context, next) => {
  return await middleware(context, next)
}