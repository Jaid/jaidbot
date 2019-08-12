import SteamGameUpdateWatcher from "steam-game-update-watcher"
import {logger, config} from "src/core"
import {ensureObject} from "magina"
import twitch from "src/twitch"
import {isEmpty} from "has-content"
import plural from "pluralize-inclusive"

export default class GameUpdateWatcher {

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

  postInit() {
    if (isEmpty(this.watchers)) {
      return false
    }
    return twitch.ready
  }

  ready() {
    for (const {instance, id, name} of this.watchers) {
      instance.on("contentChanged", () => {
        twitch.say(`HSCheers Neues Update bei ${name || "einem Game auf Steam"}: steamdb.info/depot/${id}/history`)
      })
      instance.start()
    }
    logger.info("Started Steam game update watcher with %s", plural("entry", config.watchedSteamDepotIds.length))
  }

}