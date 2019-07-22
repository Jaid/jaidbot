import PollingEmitter from "polling-emitter"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"
import execa from "execa"
import vlc from "lib/vlc"
import server from "src/server"
import emitPromise from "emit-promise"
import fetchYoutubeUploads from "fetch-youtube-uploads"
import {flatten} from "lodash"
import {unpackObject} from "magina"

class SubscriptionWatcher extends PollingEmitter {

  constructor() {
    super({
      pollInterval: config.youtubeSubscriptionsPollIntervalSeconds * 1000,
      invalidateInitialEntries: true,
    })
    this.startDate = Date.now()
    this.on("newEntry", async video => {
      const execResult = await execa(config.youtubeDlPath, [...vlc.youtubeDlParams, "--dump-single-json", video.id])
      const videoInfo = execResult.stdout |> JSON.parse
      if (!server.client) {
        twitch.say(`PopCorn Neues Video "${videoInfo.title}" von ${videoInfo.uploader || "unbekannt"} ist da, aber es besteht keine Verbindung zum Computer von Jaidchen.`)
        return
      }
      twitch.say(`PopCorn Video "${videoInfo.title}" von ${videoInfo.uploader || "unbekannt"}: youtu.be/${video.id}`)
      await emitPromise(server.client, "queueInfo", {
        videoInfo,
        downloadFormat: vlc.downloadFormat,
        commonParams: vlc.youtubeDlParams,
      })
    //  twitch.say(`PopCorn "${videoInfo.title}" ist jetzt heruntergeladen!`)
    })
  }

  async init() {
    this.start()
    logger.info("Started YouTube subscriptionWatcher")
  }

  async fetchEntries() {
    const fetchJobs = config.observedYoutubeChannels.map(async youtubeChannel => {
      return fetchYoutubeUploads(unpackObject(youtubeChannel, "id"))
    })
    logger.debug("Fetching videos from %s YouTube channels", fetchJobs.length)
    const results = await Promise.all(fetchJobs)
    const resultsList = flatten(results)
    logger.debug("Fetched %s videos from %s YouTube channels", resultsList.length, fetchJobs.length)
    return resultsList
  }

  handleError(error) {
    logger.error("Could not check YouTube subscriptions: %s", error)
  }

}

export default new SubscriptionWatcher