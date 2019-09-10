import PollingEmitter from "polling-emitter"
import twitch from "src/twitch"
import {logger, got, config} from "src/core"
import {timeout} from "promise-timeout"
import ms from "ms.macro"
import {isEmpty} from "has-content"
import {createProbot} from "probot"
import fsp from "@absolunet/fsp"

export default class OwnReleaseNotifier {

  constructor() {
  // super({
  //   pollInterval: config.travisPollIntervalSeconds * 1000,
  //   invalidateInitialEntries: true,
  // })
    this.travisGot = got.extend({
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

/**
 * @type {import("probot").ApplicationFunction}
 */
probotApp = app => {
  app.on("check_run.completed", async event => {
    const checkAppId = event.payload?.check_run?.app?.id
    if (checkAppId !== 67) {
      logger.debug("Got check_suite.completed event from GitHub, but check suite app is not Travis CI (App ID is %s)", checkAppId)
      return
    }
    if (event.payload.repository.private) {
      return
    }
    // const repo = event.payload.repository.name
    // const owner = event.payload.repository.owner.login
    const travisResponse = await this.travisGot.get(`build/${event.payload.check_run.external_id}`)
    const build = travisResponse.body
    const tagName = build?.tag?.name
    if (!tagName) {
      return
    }
    const buildName = `${build.repository.name} ${tagName}`
    if (build.state === "passed") {
      twitch.say(`PartyHat ${buildName} ist da: github.com/${build.repository.slug}/releases/${tagName}`)
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
}

async init() {
  const cert = await fsp.readFile(config.githubAppPemFilePath, "utf8")
  this.probot = createProbot({
    cert,
    secret: config.githubAppWebhookSecret,
    id: config.githubAppId,
    port: config.githubWebhookPort,
  })
  logger.info("GitHub app %s is listening to webhook port %s", config.githubAppId, config.githubWebhookPort)
  this.probot.load(this.probotApp)
  this.probot.start()
}

postInit() {
  return twitch.ready
}

  // async checkBuild(buildId) {
  //   const response = await this.got(`build/${buildId}`)
  //   const build = response.body
  //   logger.debug("Checked Travis build %s: %s", buildId, build.state)
  //   if (!build.finished_at) {
  //     return null
  //   }
  //   const buildName = `${build.repository.name} ${build.tag.name}`
  //   if (build.state === "passed") {
  //     twitch.say(`PartyHat ${buildName} ist da: github.com/${build.repository.slug}/releases/${build.tag.name}`)
  //     return true
  //   }
  //   const buildLink = `travis-ci.com/${build.repository.slug}/builds/${build.id}`
  //   if (build.state === "canceled") {
  //     twitch.say(`ItsBoshyTime Build abgebrochen: ${buildLink}`)
  //     return true
  //   }
  //   if (build.state === "failed") {
  //     twitch.say(`ItsBoshyTime Build fehlgeschlagen: ${buildLink}`)
  //     return true
  //   }
  //   twitch.say(`ItsBoshyTime Build aus unbekannten Gründen beendet: ${buildLink}`)
  //   return true
  // }

  // ready() {
  //   this.on("newEntry", build => {
  //     logger.debug("Started observing Travis build for %s %s", build.repository.slug, build.tag.name)
  //     const checkBuildInterval = async () => {
  //       const interval = setInterval(async () => {
  //         const buildGotResolved = await this.checkBuild(build.id)
  //         if (buildGotResolved) {
  //           clearInterval(interval)
  //         }
  //       }, ms`1 minute`)
  //     }
  //     timeout(checkBuildInterval(), ms`1 hour`)
  //   })
  //   this.start()
  // }

  // async fetchEntries() {
  //   const response = await this.got("builds", {
  //     query: {
  //       sort_by: "id:desc",
  //     },
  //   })
  //   const {builds} = response.body
  //   logger.debug("Fetched %s builds (latest one: %s %s)", builds.length, builds[0].repository.slug, builds[0].tag?.name || "without tag")
  //   if (!builds) {
  //     logger.warn("No build returned from Travis")
  //     return
  //   }
  // }

  // async processEntry(build) {
  //   if (build.finished_at) {
  //     return false
  //   }
  //   build.isTag = build.tag?.name?.startsWith("v")
  //   if (!build.isTag) {
  //     logger.debug("Skipping %s with build ID %s, it has no tag", build.repository.slug, build.id)
  //     return false
  //   }
  // }

}