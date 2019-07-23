import EventEmitter from "events"

import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"
import server from "src/server"
import releaseNotifier from "src/travis/releaseNotifier"
import starredReleaseNotifier from "src/github/starredReleaseNotifier"
import opendota from "src/dota/opendota"
import subscriptionWatcher from "src/youtube/subscriptionWatcher"
import tweetNotifier from "src/twitter/tweetNotifier"
import gameUpdateWatcher from "src/steam/gameUpdateWatcher"
import twitchAuth from "src/twitch/auth"
import database from "lib/database"
import "src/startDate"

class Core extends EventEmitter {

  async init() {
    try {
      this.on("ready", () => {
        this.ready()
      })
      const databaseModels = Object.values(database.models)
      for (const model of databaseModels) {
        model.associate?.(database.models)
      }
      await database.authenticate()
      if (config.databaseSchemaSync === "sync") {
        await database.sync()
      }
      if (config.databaseSchemaSync === "force") {
        await database.sync({
          force: true,
        })
      }
      if (config.databaseSchemaSync === "alter") {
        await database.sync({
          alter: true,
        })
      }
      const twitchResult = await twitch.init()
      if (twitchResult === false) {
        await twitchAuth.init()
        logger.info("Only Twitch auth server has been loaded!")
        this.emit("ready")
        return
      }
      await server.init()
      twitch.say("TBAngel Da bin ich!")
      logger.info("Twitch is ready!")
      await Promise.all([
        twitchAuth.init(),
        releaseNotifier.init(),
        opendota.init(),
        subscriptionWatcher.init(),
        tweetNotifier.init(),
        // starredReleaseNotifier.init(),
        gameUpdateWatcher.init(),
      ])
      for (const model of databaseModels) {
        model.start?.()
      }
      this.emit("ready")
    } catch (error) {
      logger.error("Could not initialize: %s", error)
      process.exit(1)
    }
  }

  async ready() {
    logger.info("Initialization done!")
  }

}

export default new Core