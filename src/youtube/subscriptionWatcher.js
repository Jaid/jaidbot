import PollingEmitter from "lib/PollingEmitter"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"
import execa from "execa"
import vlc from "lib/vlc"
import server from "src/server"
import emitPromise from "emit-promise"
import fetchYoutubeUploads from "fetch-youtube-uploads"
import {flatten} from "lodash"

class SubscriptionWatcher extends PollingEmitter {

  constructor() {
    super({
      pollIntervalSeconds: config.youtubeSubscriptionsPollIntervalSeconds,
    })
    this.startDate = Date.now()
    this.on("newEntry", async video => {
      const execResult = await execa(config.youtubeDl.path, [...vlc.youtubeDlParams, "--dump-single-json", video.id])
      const videoInfo = execResult.stdout |> JSON.parse
      if (!server.client) {
        twitch.say(`PopCorn Neues Video "${video.title}" von ${video.uploader || "unbekannt"} ist da, aber es besteht keine Verbindung zum Computer von Jaidchen.`)
        return
      }
      twitch.say(`PopCorn Neues Video "${video.title}" von ${video.uploader || "unbekannt"}: youtu.be/${video.id}`)
      await emitPromise(server.client, "queueInfo", {
        videoInfo,
        downloadFormat: vlc.downloadFormat,
        commonParams: vlc.youtubeDlParams,
      })
      twitch.say(`PopCorn "${videoInfo.title}" ist jetzt heruntergeladen!`)
    })
  }

  async init() {
    await this.invalidateEntries()
    logger.info("Started YouTube subscriptionWatcher")
  }

  async fetchEntries() {
    const fetchJobs = config.observedYoutubeChannels.map(async channelId => fetchYoutubeUploads(channelId))
    const results = await Promise.all(fetchJobs)
    return results |> flatten
  }

  handleError(error) {
    logger.error("Could not check YouTube subscriptions: %s", error)
  }

}

export default new SubscriptionWatcher