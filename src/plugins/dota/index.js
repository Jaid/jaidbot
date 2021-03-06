import {isEmpty} from "has-content"
import PollingEmitter from "polling-emitter"

import core, {logger} from "src/core"
import twitch from "src/plugins/twitch"

export default class Opendota extends PollingEmitter {

  constructor() {
    super({
      invalidateInitialEntries: true,
    })
  }

  handleConfig(config) {
    this.steamId = config.dotaSteamId32
    this.options.pollInterval = config.dotaPollIntervalSeconds * 1000
  }

  init() {
    if (isEmpty(this.steamId) || isEmpty(this.pollInterval)) {
      return false
    }
    this.got = core.got.extend({
      json: true,
      baseUrl: "https://api.opendota.com/api",
    })
  }

  postInit() {
    return twitch.isReady
  }

  ready() {
    this.on("newEntry", match => {
      const verbString = match.hasWon ? "gewonnen" : "verloren"
      twitch.say(`OSFrog ${match.hero.localized_name} hat mit ${match.kills}/${match.deaths}/${match.assists} ${verbString}: opendota.com/matches/${match.match_id}`)
    })
    this.start()
  }

  async fetchEntries() {
    if (!this.heroes) {
      const heroesResponse = await this.got("heroes")
      this.heroes = heroesResponse.body
      logger.info("Loaded %s heroes from OpenDota", this.heroes.length)
    }
    const response = await this.got(`players/${this.steamId}/recentMatches`)
    return response.body
  }

  getIdFromEntry(entry) {
    return entry.match_id
  }

  async processEntry(match) {
    match.finish_time = match.start_time + match.duration
    match.hero = this.getHeroById(match.hero_id)
    match.team = match.player_slot >= 128 ? "dire" : "radiant"
    if (match.team === "radiant") {
      match.hasWon = match.radiant_win
    } else {
      match.hasWon = !match.radiant_win
    }
  }

  getHeroById(searchId) {
    const hero = this.heroes.find(({id}) => Number(searchId) === Number(id))
    return hero || {
      name: "unknown",
      localized_name: "Unknown Hero",
      legs: 42,
    }
  }

  handleError(error) {
    logger.error("Could not check OpenDota: %s", error)
  }

}