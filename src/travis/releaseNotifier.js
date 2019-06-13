import PollingEmitter from "lib/PollingEmitter"
import got from "got"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"
import {timeout} from "promise-timeout"

class ReleaseNotifier extends PollingEmitter {

  constructor() {
    super({
      pollIntervalSeconds: config.travisPollIntervalSeconds,
      autostart: false,
    })
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.travis-ci.com/",
      headers: {
        "Travis-API-Version": 3,
        Authorization: `token ${config.travisToken}`,
      },
    })
  }

  async checkBuild(buildId) {
    const response = await this.got(`build/${buildId}`)
    const build = response.body
    logger.debug("Checked Travis build %s: %s", buildId, build.state)
    if (!build.finished_at) {
      return null
    }
    const buildName = `${build.repository.name} ${build.tag.name}`
    if (build.state === "passed") {
      twitch.say(`PartyHat ${buildName} ist da: github.com/${build.repository.slug}/releases/${build.tag.name}`)
      return true
    }
    const buildLink = `travis-ci.com/${build.repository.slug}/builds/${build.id}`
    if (build.state === "canceled") {
      twitch.say(`ItsBoshyTime Build abgebrochen: ${buildLink}`)
      return true
    }
    if (build.state === "failed") {
      twitch.say(`ItsBoshyTime Build fehlgeschlagen: ${buildLink}`)
      return true
    }
    twitch.say(`ItsBoshyTime Build aus unbekannten Gründen beendet: ${buildLink}`)
    return true
  }

  async init() {
    this.on("newEntry", build => {
      const checkBuildInterval = async () => {
        const interval = setInterval(async () => {
          const buildGotResolved = await this.checkBuild(build.id)
          if (buildGotResolved) {
            clearInterval(interval)
          }
        }, 1000 * 60)
      }
      timeout(checkBuildInterval(), 1000 * 60 * 60)
    })
    await this.invalidateEntries()
    this.start()
    logger.info("Started Travis releaseNotifier")
  }

  async fetchEntries() {
    const response = await this.got("builds")
    return response.body.builds
  }

  async processEntry(build) {
    build.isTag = build.tag?.["@type"] === "tag"
    if (!build.isTag) {
      return false
    }
  }

  handleError(error) {
    logger.error("Could not check Travis: %s", error)
  }

}

export default new ReleaseNotifier