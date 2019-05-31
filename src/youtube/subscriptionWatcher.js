import PollingEmitter from "lib/PollingEmitter"
import moment from "lib/moment"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"
import youtube from "lib/youtube"
import {flatten} from "lodash"
import execa from "execa"
import vlc from "lib/vlc"
import server from "src/server"
import emitPromise from "emit-promise"

const extractVideoIdFromThumbnailRegex = /\/(?<id>[^/]+)\/default/

class SubscriptionWatcher extends PollingEmitter {

  constructor() {
    super({
      pollIntervalSeconds: config.youtubeSubscriptionsPollIntervalSeconds,
    })
    this.startDate = Date.now()
    this.on("newEntry", async video => {
      twitch.say(`PopCorn Neues Video "${video.snippet.title}" von ${video.snippet.channelTitle}: youtu.be/${video.videoId}`)
      const execResult = await execa(config.youtubeDl.path, [...vlc.youtubeDlParams, "--dump-single-json", video.videoId])
      const videoInfo = execResult.stdout |> JSON.parse
      await emitPromise(server.client, "queueInfo", {
        videoInfo,
        downloadFormat: vlc.downloadFormat,
        commonParams: vlc.youtubeDlParams,
      })
      twitch.say(`PopCorn "${videoInfo.title}" ist jetzt heruntergeladen!`)
    })
  }

  async fetchEntries() {
    const apiJobs = config.observedYoutubeChannels.map(async channelId => {
      const result = await youtube.activities.list({
        channelId,
        part: "snippet",
        fields: "items(id,snippet(type,title,publishedAt,thumbnails,channelTitle))",
      })
      return result.data.items
    })
    const jobResults = await Promise.all(apiJobs)
    const activities = jobResults
    |> flatten
    |> #.filter(({snippet}) => snippet.type === "upload")
    for (const activity of activities) {
      activity.videoId = extractVideoIdFromThumbnailRegex.exec(activity.snippet.thumbnails.default.url).groups.id
    }
    return [activities[0]]
  }

  getIdFromEntry(activity) {
    return activity.videoId
  }

  async processEntry(activity) {
    if (moment(activity.snippet.publishedAt).isSameOrBefore(this.startDate)) {
      return false
    }
  }

  handleError(error) {
    logger.error("Could not check YouTube subscriptions: %s", error)
  }

}

export default new SubscriptionWatcher