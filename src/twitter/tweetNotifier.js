import Twit from "twit"
import config from "lib/config"
import twitch from "src/twitch"
import logger from "lib/logger"

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
    const tweetEmitter = this.twit.stream("statuses/filter", {follow: config.twitterFollowedIds})
    tweetEmitter.on("tweet", tweet => {
      twitch.say(`Tweet von ${tweet.user.name}: ${tweet.text}`)
    })
    tweetEmitter.on("delete", tweet => {
      twitch.say(`${tweet.user.name} hat einen Tweet gelöscht: ${tweet.text}`)
    })
    logger.info("Started Tweet notifier")
  }

}

export default new TweetNotifier