import EventEmitter from "events"

import twitch from "src/twitch"
import logger from "lib/logger"
import server from "src/server"
import releaseNotifier from "src/travis/releaseNotifier"
import opendota from "src/dota/opendota"
import subscriptionWatcher from "src/youtube/subscriptionWatcher"
import tweetNotifier from "src/twitter/tweetNotifier"
import "src/startDate"

class Core extends EventEmitter {

  async init() {
    logger.info(`${_PKG_TITLE} v${_PKG_VERSION}`)
    await server.init()
    await twitch.init()
    await Promise.all([
      releaseNotifier.init(),
      opendota.init(),
      subscriptionWatcher.init(),
      tweetNotifier.init(),
    ])
    twitch.say("TBAngel Da bin ich!")
    logger.info("Ready!")
    this.emit("ready")
  }

}

export default new Core