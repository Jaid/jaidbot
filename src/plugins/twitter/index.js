import {isEmpty} from "has-content"
import {unpackObject} from "magina"
import Twit from "twit"
import zahl from "zahl"

import {logger} from "src/core"
import twitch from "src/plugins/twitch"

const getTweetText = tweet => {
  return tweet.extended_tweet?.full_text || tweet.text
}

export default class TweetWatcher {

  handleConfig(config) {
    this.followedIds = config.twitterFollowedIds
    this.twit = new Twit({
      consumer_key: config.twitterConsumerKey,
      consumer_secret: config.twitterConsumerSecret,
      access_token: config.twitterAccessToken,
      access_token_secret: config.twitterAccessSecret,
    })
  }

  init() {
    if (isEmpty(this.followedIds)) {
      return false
    }
  }

  postInit() {
    return twitch.isReady
  }

  ready() {
    const tweetEmitter = this.twit.stream("statuses/filter", {
      follow: this.followedIds.map(watchEntry => unpackObject(watchEntry, "id")),
      filter_level: "none",
    })
    tweetEmitter.on("tweet", tweet => {
      if (!this.isOwnTweet(tweet)) {
        return
      }
      twitch.say(`MercyWing2 ${tweet.user.name} tweetet: ${tweet |> getTweetText}`)
    })
    tweetEmitter.on("delete", tweet => {
      if (!this.isOwnTweet(tweet)) {
        return
      }
      twitch.say(`CurseLit ${tweet.user.name} hat einen Tweet gelöscht: ${tweet.text}`)
    })
    logger.info("Started tweet notifier for %s", zahl(this.followedIds, "profile"))
  }

  isOwnTweet = tweet => {
    if (tweet.retweeted_status) {
      return false
    }
    if (tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== tweet.user.id) {
      return false
    }
    if (!tweet?.user?.id_str) {
      return false
    }
    return this.followedIds.includes(tweet.user.id_str)
  }

}