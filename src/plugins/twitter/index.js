import Twit from "twit"
import {config, logger} from "src/core"
import twitch from "src/twitch"
import {unpackObject} from "magina"
import {isEmpty} from "lodash"
import plural from "pluralize-inclusive"

const isOwnTweet = tweet => {
  if (tweet.retweeted_status) {
    return false
  }
  if (tweet.in_reply_to_user_id && tweet.in_reply_to_user_id !== tweet.user.id) {
    return false
  }
  return config.twitterFollowedIds.includes(tweet.user.id_str)
}

const getTweetText = tweet => {
  return tweet.extended_tweet?.full_text || tweet.text
}

export default class TweetWatcher {

  init() {
    this.twit = new Twit({
      consumer_key: config.twitterConsumerKey,
      consumer_secret: config.twitterConsumerSecret,
      access_token: config.twitterAccessToken,
      access_token_secret: config.twitterAccessSecret,
    })
  }

  postInit() {
    if (isEmpty(config.twitterFollowedIds)) {
      return false
    }
    return twitch.ready
  }

  ready() {
    const tweetEmitter = this.twit.stream("statuses/filter", {
      follow: config.twitterFollowedIds.map(watchEntry => unpackObject(watchEntry, "id")),
      filter_level: "none",
    })
    tweetEmitter.on("tweet", tweet => {
      if (!isOwnTweet(tweet)) {
        return
      }
      twitch.say(`MercyWing2 ${tweet.user.name} tweetet: ${tweet |> getTweetText}`)
    })
    tweetEmitter.on("delete", tweet => {
      if (!isOwnTweet(tweet)) {
        return
      }
      twitch.say(`CurseLit ${tweet.user.name} hat einen Tweet gelöscht: ${tweet.text}`)
    })
    logger.info("Started tweet notifier for %s", plural("profile", config.twitterFollowedIds.length))
  }

}