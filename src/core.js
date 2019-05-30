import EventEmitter from "events"

import twitch from "src/twitch"
import logger from "lib/logger"
import server from "src/server"
import releaseNotifier from "src/travis/releaseNotifier"
import resultNotifier from "src/dota/resultNotifier"
import "src/startDate"

class Core extends EventEmitter {

  async init() {
    logger.info(`${_PKG_TITLE} v${_PKG_VERSION}`)
    await server.init()
    await twitch.init()
    await releaseNotifier.init()
    await resultNotifier.init()
    twitch.say("TBAngel Da bin ich!")
    logger.info("Ready!")
    this.emit("ready")
  }

}

export default new Core