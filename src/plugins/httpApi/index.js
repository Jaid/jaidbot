import core, {logger} from "src/core"
import {router} from "fast-koa-router"
import twitch from "src/plugins/twitch"
import {isEmpty} from "has-content"

export default class Main {

  handleConfig(config) {
    if (isEmpty(config.adminPassword)) {
      logger.warn("No admin password set for HTTP API")
    }
    this.password = config.adminPassword
  }

  /**
   * @type {import("koa").Middleware}
   */
  async checkPassword(context, next) {
    if (isEmpty(this.password)) {
      context.throw(400, "Admin endpoints are not enabled")
    }
    const givenPassword = context.request.header["admin-password"]
    if (!givenPassword) {
      context.throw(401, "No admin password given")
    }
    if (givenPassword !== this.password) {
      context.throw(401, "Wrong admin password")
    }
    await next()
  }

  init() {
    const checkPassword = this.checkPassword.bind(this)
    const routes = {
      get: {
        "/commands": require("./handlers/commands").default,
      },
      post: {
        "/admin/chat": require("./handlers/chat").default,
      },
      policy: {
        "/admin/chat": checkPassword,
      },
    }
    core.koa.use(router(routes))
  }

  postInit() {
    return twitch.ready
  }

}