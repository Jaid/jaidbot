import Twit from "twit"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"

const isOwnTweet = tweet => {
  if (tweet.retweeted_status) {
    return false
  }
  return config.twitterFollowedIds.includes(tweet.user.id_str)
}

const getTweetText = tweet => {
  return tweet.extended_tweet?.full_text || tweet.text
}

class TweetNotifier {

  constructor() {
    this.twit = new Twit({
      consumer_key: config.twitterConsumerKey,
      consumer_secret: config.twitterConsumerSecret,
      access_token: config.twitterAccessToken,
      access_token_secret: config.twitterAccessSecret,
    })
  }

  async init() {
    const tweetEmitter = this.twit.stream("statuses/filter", {
      follow: config.twitterFollowedIds,
      filter_level: "none",
    })
    tweetEmitter.on("tweet", tweet => {
      if (!isOwnTweet(tweet)) {
        return
      }
      debugger
      twitch.say(`MercyWing2 Tweet von ${tweet.user.name}: ${tweet |> getTweetText}`)
    })
    tweetEmitter.on("delete", tweet => {
      if (!isOwnTweet(tweet)) {
        return
      }
      twitch.say(`CurseLit ${tweet.user.name} hat einen Tweet gelöscht: ${tweet.text}`)
    })
    logger.info("Started Tweet notifier")
  }

}

export default new TweetNotifier