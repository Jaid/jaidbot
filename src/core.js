import EventEmitter from "events"

import config from "lib/config"
// import twitch from "src/twitch"
import logger from "lib/logger"
// import server from "src/server"
// import releaseNotifier from "src/travis/releaseNotifier"
// import starredReleaseNotifier from "src/github/starredReleaseNotifier"
// import opendota from "src/dota/opendota"
// import subscriptionWatcher from "src/youtube/subscriptionWatcher"
// import tweetNotifier from "src/twitter/tweetNotifier"
// import gameUpdateWatcher from "src/steam/gameUpdateWatcher"
import twitchAuth from "src/twitch/auth"
import database from "lib/database"

import "src/startDate"

class Core extends EventEmitter {

  async init() {
    await database.authenticate()
    if (config.databaseSchemaSync === "sync") {
      await database.sync()
    }
    if (config.databaseSchemaSync === "force") {
      await database.sync({
        force: true,
      })
    }
    // await server.init()
    // await twitch.init()
    //  twitch.say("TBAngel Da bin ich!")
    logger.info("Twitch is ready!")
    await Promise.all([
      twitchAuth.init(),
      // releaseNotifier.init(),
      // opendota.init(),
      // subscriptionWatcher.init(),
      // tweetNotifier.init(),
      // starredReleaseNotifier.init(),
      // gameUpdateWatcher.init(),
    ])
    logger.info("Extensions are ready!")
    this.emit("ready")
  }

}

export default new Core