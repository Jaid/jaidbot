import twitch from "src/twitch"
import {logger} from "src/core"

export default class Main {

  async init() {
    await twitch.init()
    if (!twitch.ready) {
      logger.warn("Twitch has not been loaded")
    }
  }

  ready() {
    if (twitch.ready) {
      twitch.say("TBAngel Da bin ich!")
    }
  }

  collectModels() {
    const models = {}
    const modelsRequire = require.context("../../models/", true, /.js$/)
    for (const value of modelsRequire.keys()) {
      const modelName = value.match(/\.\/(?<key>[\da-z]+)\./i).groups.key
      models[modelName] = modelsRequire(value)
    }
    return models
  }

}