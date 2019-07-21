import essentialConfig from "essential-config"
import logger from "lib/logger"

import defaults from "./defaults.yml"

const config = essentialConfig(_PKG_TITLE, {
  defaults,
  sensitiveKeys: [
    "serverPassword",
    "twitchBotClientId",
    "twitchBotClientToken",
    "twitchApiClientId",
    "twitchApiClientToken",
    "twitchClientId",
    "twitchClientSecret",
    "travisToken",
    "youtubeClientId",
    "youtubeClientSecret",
    "youtubeClientAccessToken",
    "youtubeClientRefreshToken",
    "twitterConsumerKey",
    "twitterConsumerSecret",
    "twitterAccessToken",
    "twitterAccessSecret",
    "githubToken",
  ],
})

if (!config) {
  logger.warn("Set up default config, please edit and restart")
  process.exit(2)
}

export const appFolder = config.appFolder
export default config.config