import PollingEmitter from "lib/PollingEmitter"
import got from "got"
import moment from "lib/moment"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"

class Opendota extends PollingEmitter {

  constructor() {
    super({
      pollIntervalSeconds: config.dotaPollIntervalSeconds,
      autostart: false,
    })
    this.startDate = Date.now()
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.opendota.com/api",
    })
  }

  async init() {
    this.on("newEntry", match => {
      const verbString = match.hasWon ? "gewonnen" : "verloren"
      twitch.say(`OSFrog ${match.hero.localized_name} hat mit ${match.kills}/${match.deaths}/${match.assists} ${verbString}: opendota.com/matches/${match.match_id}`)
    })
    this.start()
    logger.info("Started OpenDota notifier")
  }

  async fetchEntries() {
    if (!this.heroes) {
      const heroesResponse = await this.got("heroes")
      this.heroes = heroesResponse.body
      logger.info("Loaded %s heroes from OpenDota", this.heroes.length)
    }
    const response = await this.got(`players/${config.dotaSteamId32}/recentMatches`)
    return response.body
  }

  getIdFromEntry(entry) {
    return entry.match_id
  }

  async processEntry(match, id) {
    match.finish_time = match.start_time + match.duration
    if (moment(match.finish_time * 1000).isSameOrBefore(this.startDate)) {
      return false
    }
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

export default new Opendota