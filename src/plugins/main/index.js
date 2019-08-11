import {logger} from "src/core"
import twitch from "src/twitch"

export default class Main {

  constructor(core) {
    core.hooks.init.tapPromise("main", async () => {
      await twitch.init()
    })
  }

  addModels(addModel) {
    const modelsRequire = require.context("../../models/", true, /.js$/)
    for (const value of modelsRequire.keys()) {
      const modelName = value.match(/\.\/(?<key>[\da-z]+)\./i).groups.key
      addModel(modelName, modelsRequire(value))
    }
  }

}