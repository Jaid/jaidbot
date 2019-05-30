import EventEmitter from "events"

import got from "got"
import moment from "lib/moment"
import config from "lib/config"
import twitch from "src/twitch"
import startDate from "src/startDate"
import logger from "lib/logger"

class ReleaseNotifier extends EventEmitter {

  async init() {
    this.processedIds = new Set
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.opendota.com/api",
    })
    const heroesResponse = await this.got("heroes")
    this.heroes = heroesResponse.body
    this.on("newMatch", match => {
      const verbString = match.hasWon ? "gewonnen" : "verloren"
      twitch.say(`OSFrog ${match.hero.localized_name} hat mit ${match.kills}/${match.deaths}/${match.assists} ${verbString}: opendota.com/matches/${match.match_id}`)
    })
    setInterval(() => {
      try {
        this.check()
      } catch (error) {
        logger.error("Could not check OpenDota: %s", error)
      }
    }, config.dota.pollIntervalSeconds * 1000)
  }

  async check() {
    const matchesResponse = await this.got(`players/${config.dota.steamId32}/recentMatches`)
    const unprocessedMatches = matchesResponse.body.filter(({match_id}) => !this.processedIds.has(match_id))
    for (const match of unprocessedMatches) {
      this.processedIds.add(match.match_id)
      match.finish_time = match.start_time + match.duration
      if (moment(match.finish_time * 1000).isSameOrBefore(startDate)) {
        continue
      }
      match.hero = this.getHeroById(match.hero_id)
      match.team = match.player_slot >= 128 ? "dire" : "radiant"
      if (match.team === "radiant") {
        match.hasWon = match.radiant_win
      } else {
        match.hasWon = !match.radiant_win
      }
      this.emit("newMatch", match)
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

}

export default new ReleaseNotifier