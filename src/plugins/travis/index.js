import PollingEmitter from "polling-emitter"
import twitch from "src/twitch"
import {logger, got, config} from "src/core"
import {timeout} from "promise-timeout"
import ms from "ms.macro"
import {isEmpty} from "has-content"

export default class OwnReleaseNotifier extends PollingEmitter {

  constructor() {
    super({
      pollInterval: config.travisPollIntervalSeconds * 1000,
      invalidateInitialEntries: true,
    })
    this.got = got.extend({
      json: true,
      baseUrl: "https://api.travis-ci.com",
      headers: {
        "Travis-API-Version": 3,
        Authorization: `token ${config.travisToken}`,
      },
    })
  }

  preInit() {
    if (isEmpty(config.travisToken)) {
      return false
    }
  }

  postInit() {
    return twitch.ready
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

  ready() {
    this.on("newEntry", build => {
      const checkBuildInterval = async () => {
        const interval = setInterval(async () => {
          const buildGotResolved = await this.checkBuild(build.id)
          if (buildGotResolved) {
            clearInterval(interval)
          }
        }, ms`1 minute`)
      }
      timeout(checkBuildInterval(), ms`1 hour`)
    })
    this.start()
  }

  async fetchEntries() {
    const response = await this.got("builds")
    const {builds} = response.body
    if (!builds) {
      logger.warn("No build returned from Travis")
      return []
    }
    return builds
  }

  async processEntry(build) {
    if (build.finished_at) {
      return false
    }
    build.isTag = build.tag?.name?.startsWith("v")
    if (!build.isTag) {
      return false
    }
  }

  handleError(error) {
    logger.error("Could not check Travis: %s", error)
  }

}