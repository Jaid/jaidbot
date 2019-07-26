import PollingEmitter from "polling-emitter"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"
import fetchYoutubeUploads from "fetch-youtube-uploads"
import {flatten} from "lodash"
import ensureObject from "ensure-object"
import Video from "src/models/Video"
import regexParser from "regex-parser"
import pMinDelay from "p-min-delay"
import ms from "ms.macro"
import pMap from "p-map"

/**
 * @typedef {Object} YoutubeVideo
 * @prop {string} id
 * @prop {string} title
 * @prop {number} priority
 * @prop {import("../lib/config").ObservedYoutubeChannel} channel
 */

/**
 * @callback newEntryHandler
 * @param {YoutubeVideo} youtubeVideo
 */

class SubscriptionWatcher extends PollingEmitter {

  constructor() {
    super({
      pollInterval: config.youtubeSubscriptionsPollIntervalSeconds * 1000,
      invalidateInitialEntries: true,
    })
    this.startDate = Date.now()
    this.on("newEntry", /** @type {newEntryHandler} */ async youtubeVideo => {
      try {
        if (youtubeVideo.channel?.titleRegex) {
          if (!regexParser(youtubeVideo.channel.titleRegex).test(youtubeVideo.title)) {
            logger.info("Skipping new video \"%s\" by %s, because it failed RegExp test %s", youtubeVideo.title, youtubeVideo.channel.name, youtubeVideo.channel.titleRegex)
            return
          }
        }
        const url = `youtu.be/${youtubeVideo.id}`
        const video = await Video.queueByUrl(url, {
          priority: youtubeVideo.channel.priority || config.videoSubscriptionPriority,
        })
        twitch.say(`PopCorn Video "${video.title}" von ${youtubeVideo.channel.name || video.publisher}: ${url}`)
      } catch (error) {
        logger.error("Found new YouTube video %s, but couldn't process it: %s", youtubeVideo.id, error)
      }
    })
  }

  async init() {
    this.start()
    logger.info("Started YouTube subscriptionWatcher for %s subscriptions", config.observedYoutubeChannels.length)
  }

  async fetchEntries() {
    const mapper = async entry => {
      /**
       * @type {import("../lib/config").ObservedYoutubeChannel}
       */
      const channel = ensureObject(entry, "id")
      /**
       * @type {YoutubeVideo}
       */
      logger.debug("Fetching YouTube videos from %s", channel.name)
      const youtubeVideos = await pMinDelay(fetchYoutubeUploads(channel.id), config.secondsBetweenYoutubeChecks * 1000, {
        delayRejection: false,
      })
      return youtubeVideos.map(video => ({
        ...video,
        channel,
      }))
    }
    const results = await pMap(config.observedYoutubeChannels, mapper, {concurrency: 1})
    const resultsList = flatten(results)
    logger.debug("Fetched %s videos from %s YouTube channels", resultsList.length, config.observedYoutubeChannels.length)
    return resultsList
  }

  handleError(error) {
    logger.error("Could not check YouTube subscriptions: %s", error)
  }

}

export default new SubscriptionWatcher