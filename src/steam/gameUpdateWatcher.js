import SteamGameUpdateWatcher from "steam-game-update-watcher"
import config from "lib/config"
import logger from "lib/logger"
import {ensureObject} from "magina"
import twitch from "src/twitch"
import {isEmpty} from "has-content"

class GameUpdateWatcher {

  constructor() {
    this.watchers = []
    for (const watchedDepot of config.watchedSteamDepotIds) {
      const depot = ensureObject(watchedDepot, "id")
      const watcher = new SteamGameUpdateWatcher({
        depotId: depot.id,
        pollInterval: config.watchSteamGamesIntervalSeconds * 1000,
      })
      this.watchers.push({
        instance: watcher,
        ...depot,
      })
    }
  }

  async init() {
    if (isEmpty(this.watchers)) {
      return
    }
    for (const {instance, id, name} of this.watchers) {
      instance.on("contentChanged", () => {
        twitch.say(`HSCheers Neues Update bei ${name || "einem Game auf Steam"}: steamdb.info/depot/${id}/history`)
      })
      instance.start()
    }
    logger.info(`Started Steam game update watcher with ${config.watchedSteamDepotIds.length} entries `)
  }

}

export default new GameUpdateWatcher