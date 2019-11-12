import SteamGameUpdateWatcher from "steam-game-update-watcher"
import {logger} from "src/core"
import {ensureObject} from "magina"
import twitch from "src/plugins/twitch"
import {isEmpty} from "has-content"
import zahl from "zahl"

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
    return twitch.ready
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