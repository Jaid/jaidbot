import delay from "delay"
import ensureObject from "ensure-object"
import fetchYoutubeUploads from "fetch-youtube-uploads"
import {isEmpty} from "has-content"
import pAll from "p-all"
import pMinDelay from "p-min-delay"
import PollingEmitter from "polling-emitter"
import regexParser from "regex-parser"
import zahl from "zahl"

import {logger} from "src/core"
import Video from "src/models/Video"
import twitch from "src/plugins/twitch"

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

export default class SubscriptionWatcher extends PollingEmitter {

  constructor() {
    super({
      invalidateInitialEntries: true,
    })
  }

  handleConfig(config) {
    this.observedChannels = config.observedYoutubeChannels
    this.options.pollInterval = config.youtubeSubscriptionsPollIntervalSeconds * 1000
    this.videoAddDelay = config.videoSubscriptionAddDelaySeconds * 1000
    this.defaultPriority = config.videoSubscriptionPriority
    this.forcedTimeBetweenChecks = config.secondsBetweenYoutubeChecks * 1000
  }

  init() {
    if (isEmpty(this.observedChannels)) {
      return false
    }
    this.on("initialEntry", /** @type {newEntryHandler} */ youtubeVideo => {
      logger.debug("Found video \"%s\", but it is not new.", youtubeVideo.title)
    })
    this.on("newEntry", /** @type {newEntryHandler} */ async youtubeVideo => {
      try {
        if (youtubeVideo.channel?.titleRegex && !regexParser(youtubeVideo.channel.titleRegex).test(youtubeVideo.title)) {
          logger.info("Skipping new video \"%s\" by %s, because it failed RegExp test %s", youtubeVideo.title, youtubeVideo.channel.name, youtubeVideo.channel.titleRegex)
          return
        }
        if (youtubeVideo.channel?.titleRegexNot && regexParser(youtubeVideo.channel.titleRegexNot).test(youtubeVideo.title)) {
          logger.info("Skipping new video \"%s\" by %s, because it succeeded RegExp test %s", youtubeVideo.title, youtubeVideo.channel.name, youtubeVideo.channel.titleRegexNot)
          return
        }
        const url = `youtu.be/${youtubeVideo.id}`
        if (youtubeVideo.channel.name) {
          twitch.say(`PopCorn Video "${youtubeVideo.title}" von ${youtubeVideo.channel.name}: ${url}`)
        } else {
          twitch.say(`PopCorn Video "${youtubeVideo.title}": ${url}`)
        }
        await delay(this.videoAddDelay)
        await Video.queueByUrl(url, {
          priority: youtubeVideo.channel.priority || this.defaultPriority,
        })
      } catch (error) {
        logger.error("Found new YouTube video %s, but couldn't process it: %s", youtubeVideo.id, error)
      }
    })
  }

  postInit() {
    return twitch.isReady
  }

  ready() {
    this.start()
    logger.info("Started YouTube subscriptionWatcher for %s", zahl(this.observedChannels, "subscription"))
  }

  async fetchEntries() {
    const results = []
    const mapper = async entry => {
      /**
       * @type {import("../lib/config").ObservedYoutubeChannel}
       */
      const channel = ensureObject(entry, "id")
      /**
       * @type {YoutubeVideo}
       */
      logger.debug("Fetching YouTube videos from %s", channel.name)
      try {
        const youtubeVideos = await pMinDelay(fetchYoutubeUploads(channel.id), this.forcedTimeBetweenChecks, {
          delayRejection: false,
        })
        for (const video of youtubeVideos) {
          results.push({
            ...video,
            channel,
          })
        }
      } catch (error) {
        logger.error("Could not fetch YouTube channel %s", channel.name)
        throw error
      }
    }
    const jobs = this.observedChannels.map(channel => mapper(channel)) // Must be wrapped into a function, so Promises don't automatically start
    await pAll(jobs, {concurrency: 1})
    logger.debug("Fetched %s from %s", zahl(results, "video"), zahl(this.observedChannels, "channel"))
    return results
  }

  handleError(error) {
    logger.error("Could not check YouTube subscriptions: %s", error)
  }

}