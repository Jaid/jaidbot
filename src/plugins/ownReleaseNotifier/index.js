import twitch from "src/twitch"
import core, {logger, config} from "src/core"
import {isEmpty} from "has-content"
import {createProbot} from "probot"
import fsp from "@absolunet/fsp"

export default class OwnReleaseNotifier {

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
      const travisResponse = await this.travisGot.get(`build/${event.payload.check_run.external_id}`)
      const build = travisResponse.body
      const tagName = build?.tag?.name
      if (isEmpty(tagName)) {
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
    this.travisGot = core.got.extend({
      json: true,
      baseUrl: "https://api.travis-ci.com",
      headers: {
        "Travis-API-Version": 3,
        Authorization: `token ${config.travisToken}`,
      },
    })
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

}