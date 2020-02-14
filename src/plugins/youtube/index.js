import delay from "delay"
import ensureObject from "ensure-object"
import {isEmpty} from "has-content"
import {JaidCorePlugin} from "jaid-core"
import regexParser from "regex-parser"
import zahl from "zahl"

import {logger} from "src/core"
import Video from "src/models/Video"
import twitch from "src/plugins/twitch"

import ChannelEmitter from "./ChannelEmitter"

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

export default class SubscriptionWatcher extends JaidCorePlugin {

  handleConfig(config) {
    this.observedChannels = config.observedYoutubeChannels
    this.pollInterval = config.youtubeSubscriptionsPollIntervalSeconds * 1000
    this.defaultPriority = config.videoSubscriptionPriority
    this.forcedTimeBetweenChecks = config.secondsBetweenYoutubeChecks * 1000
  }

  /**
   * @param {YoutubeVideo} youtubeVideo
   * @return {Promise<void>}
   */
  async handleNewVideo(youtubeVideo) {
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
      await Video.queueByUrl(url, {
        priority: youtubeVideo.channel.priority || this.defaultPriority,
      })
    } catch (error) {
      logger.error("Found new YouTube video %s, but couldn't process it: %s", youtubeVideo.id, error)
    }
  }

  init() {
    if (isEmpty(this.observedChannels)) {
      return false
    }
    this.collectPollingEmitters()
  }

  async collectPollingEmitters() {
    const handleNewVideo = this.handleNewVideo.bind(this)
    this.pollingEmitters = []
    let index = 0
    for (const observedChannel of this.observedChannels) {
      if (index !== 0 && this.forcedTimeBetweenChecks > 0) {
        await delay(this.forcedTimeBetweenChecks)
      }
      const channel = ensureObject(observedChannel, "id")
      const channelEmitter = new ChannelEmitter(channel, logger, this.pollInterval)
      channelEmitter.on("newEntry", handleNewVideo)
      this.pollingEmitters.push(channelEmitter)
      index++
    }
    logger.info("Started YouTube subscriptionWatcher for %s", zahl(this.pollingEmitters, "subscription"))
  }

  postInit() {
    return twitch.isReady
  }

}