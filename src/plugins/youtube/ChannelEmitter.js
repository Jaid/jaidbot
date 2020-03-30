import fetchYoutubeUploads from "fetch-youtube-uploads"
import {isEmpty} from "has-content"
import PollingEmitter from "polling-emitter"

export default class ChannelEmitter extends PollingEmitter {

  constructor(channel, logger, pollInterval) {
    super({
      autostart: true,
      pollInterval,
      invalidateInitialEntries: true,
    })
    this.channel = channel
    this.logger = logger
  }

  async fetchEntries() {
    const results = []
    const youtubeVideos = await fetchYoutubeUploads(this.channel.id)
    for (const video of youtubeVideos) {
      if (!video.published) {
        continue
      }
      results.push({
        ...video,
        channel: this.channel,
      })
    }
    if (isEmpty(youtubeVideos)) {
      throw new Error(`Fetched no videos from ${this.channel.name || this.channel.id}`)
    }
    return results
  }

  handleError(error) {
    this.logger.warn(error)
  }

}