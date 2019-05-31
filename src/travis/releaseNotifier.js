import PollingEmitter from "lib/PollingEmitter"
import got from "got"
import moment from "lib/moment"
import config from "lib/config"
import twitch from "src/twitch"

class ReleaseNotifier extends PollingEmitter {

  constructor() {
    super({
      pollIntervalSeconds: config.travisPollIntervalSeconds,
      autostart: false,
    })
    this.startDate = Date.now()
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.travis-ci.com/",
      headers: {
        "Travis-API-Version": 3,
        Authorization: `token ${config.travisToken}`,
      },
    })
  }

  async init() {
    this.on("newEntry", build => {
      const buildName = `${build.repository.name} ${build.tag.name}`
      if (build.state === "passed") {
        twitch.say(`PartyHat ${buildName} ist da: github.com/${build.repository.slug}/releases/tag/${build.tag.name}`)
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
    this.start()
  }

  async fetchEntries() {
    const response = await this.got("builds")
    return response.body.builds
  }

  async processEntry(build, id) {
    if (!build.finished_at) {
      return false
    }
    build.isTag = build.tag?.["@type"] === "tag"
    if (!build.isTag) {
      return false
    }
    if (moment(build.finished_at).isSameOrBefore(this.startDate)) {
      return false
    }
  }

  handleError(error) {
    logger.error("Could not check Travis: %s", error)
  }

}

export default new ReleaseNotifier