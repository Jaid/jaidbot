import {isEmpty} from "has-content"
import {ensureObject} from "magina"
import SteamGameUpdateWatcher from "steam-game-update-watcher"
import zahl from "zahl"

import {logger} from "src/core"
import twitch from "src/plugins/twitch"

export default class GameUpdateWatcher {

  constructor() {
    this.watchers = []
  }

  handleConfig(config) {
    this.depotIds = config.watchedSteamDepotIds
    this.pollInterval = config.watchSteamGamesIntervalSeconds * 1000
  }

  init() {
    if (isEmpty(this.depotIds) || isEmpty(this.pollInterval)) {
      return false
    }
    for (const watchedDepot of this.depotIds) {
      const depot = ensureObject(watchedDepot, "id")
      const watcher = new SteamGameUpdateWatcher({
        depotId: depot.id,
        pollInterval: this.pollInterval,
      })
      this.watchers.push({
        instance: watcher,
        ...depot,
      })
    }
  }

  postInit() {
    return twitch.isReady
  }

  ready() {
    for (const {instance, id, name} of this.watchers) {
      instance.on("contentChanged", () => {
        twitch.say(`HSCheers Neues Update bei ${name || "einem Game auf Steam"}: steamdb.info/depot/${id}/history`)
      })
      instance.start()
    }
    logger.info("Started Steam game update watcher with %s", zahl(this.depotIds, "entry"))
  }

}