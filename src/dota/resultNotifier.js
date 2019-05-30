import EventEmitter from "events"

import got from "got"
import moment from "lib/moment"
import config from "lib/config"
import twitch from "src/twitch"
import startDate from "src/startDate"

class ReleaseNotifier extends EventEmitter {

  async init() {
    this.processedIds = new Set
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.opendota.com/api",
      resolveBodyOnly: true,
    })
    this.heroes = await this.got("heroes")
    this.on("newMatch", match => {
      twitch.say(`https://opendota.com/matches/${match.match_id}`)
    })
    setInterval(() => this.check(), 10000)
  }

  async check() {
    const recentMatches = await this.got(`players/${config.dota.steamId32}/recentMatches`)
    const unprocessedMatches = recentMatches.filter(({match_id}) => !this.processedIds.has(match_id))
    for (const match of unprocessedMatches) {
      this.processedIds.add(match.match_id)
      match.finish_time = match.start_time + match.duration
      if (moment(match.finish_time * 1000).isSameOrBefore(startDate)) {
        continue
      }
      match.hero = this.getHeroById()
      match.team = match.player_slot >= 128 ? "dire" : "radiant"
      if (match.team === "radiant") {
        match.hasWon = match.radiant_win
      } else {
        match.hasWon = !match.radiant_win
      }
      this.emit("newMatch", match)
    }
  }

  getHeroById(id) {
    const hero = this.heroes.find(({heroId}) => Number(heroId) === Number(id))
    return hero || {
      name: "unknown",
      localized_name: "Unknown Hero",
      legs: 42,
    }
  }

}

export default new ReleaseNotifier