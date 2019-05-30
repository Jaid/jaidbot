import EventEmitter from "events"

import got from "got"
import {isEmpty, isString} from "lodash"
import moment from "lib/moment"
import config from "lib/config"
import twitch from "src/twitch"
import startDate from "src/startDate"

class ReleaseNotifier extends EventEmitter {

  async init() {
    this.processedIds = new Set
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.travis-ci.com",
      headers: {
        "Travis-API-Version": 3,
        Authorization: `token ${config.travisToken}`,
      },
    })
    this.on("newTagBuild", build => {
      const buildName = `${build.repository.name} ${build.tag.name}`
      if (build.state === "passed") {
        twitch.say(`PartyHat ${buildName} ist da: github.com/${build.repository.slug}/tag/${build.tag.name}`)
        return
      }
      const buildLink = `travis-ci.com/${build.repository.slug}/builds/${build.id}`
      if (build.state === "canceled") {
        twitch.say(`ItsBoshyTime Build abgebrochen: ${buildLink}`)
        return
      }
      if (build.state === "failed") {
        twitch.say(`ItsBoshyTime Build fehlgeschlagen: ${buildLink}`)
        return
      }
      twitch.say(`ItsBoshyTime Build aus unbekannten Gründen beendet: ${buildLink}`)
    })
    setInterval(() => this.check(), 10000)
  }

  async check() {
    const {body: result} = await this.got("builds")
    const tagBuilds = result.builds.filter(({id, tag, finished_at}) => tag?.["@type"] === "tag" && isString(finished_at) && !this.processedIds.has(id))
    if (tagBuilds |> isEmpty) {
      return
    }
    for (const build of tagBuilds) {
      processedIds.add(build.id)
      if (moment(build.finished_at).isSameOrBefore(startDate)) {
        continue
      }
      this.emit("newTagBuild", build)
    }
  }

}

export default new ReleaseNotifier
