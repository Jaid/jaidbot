import twitch from "src/twitch"

/**
 * @type {import("koa").Middleware}
 */
const middleware = async (context, next, password) => {
  await next()
}

export default async (context, next) => {
  return await middleware(context, next)
}