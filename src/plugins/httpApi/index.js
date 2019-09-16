import core from "src/core"
import {router} from "fast-koa-router"
import twitch from "src/twitch"

export default class Main {

  init() {
    const routes = {
      get: {
        "/commands": require("./handlers/commands").default,
      },
    }
    core.koa.use(router(routes))
  }

  postInit() {
    return twitch.ready
  }

}