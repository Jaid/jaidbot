import JaidCore from "jaid-core"

import defaults from "./config.yml"

const core = new JaidCore({
  name: _PKG_TITLE,
  version: _PKG_VERSION,
  insecurePort: 17441,
  database: true,
  useGot: true,
  configSetup: {
    defaults,
    secretKeys: [
      "adminPassword",
      "twitchBotAccessToken",
      "twitchBotRefreshToken",
      "databasePassword",
      "githubAppPemFilePath",
      "githubAppWebhookSecret",
      "githubToken",
      "serverPassword",
      "twitchStreamerAccessToken",
      "twitchStreamerRefreshToken",
      "travisToken",
      "twitchClientId",
      "twitchClientSecret",
      "twitterAccessSecret",
      "twitterAccessToken",
      "twitterConsumerKey",
      "twitterConsumerSecret",
      "youtubeClientAccessToken",
      "youtubeClientId",
      "youtubeClientRefreshToken",
      "youtubeClientSecret",
    ],
  },
})

/**
 * @typedef {Object} Config
 * @prop {string} youtubeClientRedirectUrl
 * @prop {Object<string, HiMessage>} hiMessages
 * @prop {string} youtubeDlPath
 * @prop {string} youtubeDlCookieFile
 * @prop {string} youtubeDlFormat
 * @prop {string} dotaSteamId32
 * @prop {number} dotaPollIntervalSeconds
 * @prop {number} travisPollIntervalSeconds
 * @prop {number} youtubeSubscriptionsPollIntervalSeconds
 * @prop {ObservedYoutubeChannel[]} observedYoutubeChannels
 * @prop {Object<string, string>} categoryShortcuts
 * @prop {number} starredReleasesPollIntervalSeconds
 * @prop {string} starredReleasesUser
 * @prop {WatchedSteamDepotId[]} watchedSteamDepotIds
 * @prop {number} watchSteamGamesIntervalSeconds
 * @prop {string} twitchClientCallbackUrl
 * @prop {string} serverPassword
 * @prop {string} twitchClientId
 * @prop {string} twitchClientSecret
 * @prop {string} travisToken
 * @prop {string} youtubeClientId
 * @prop {string} youtubeClientSecret
 * @prop {string} youtubeClientAccessToken
 * @prop {string} youtubeClientRefreshToken
 * @prop {string} twitterConsumerKey
 * @prop {string} twitterConsumerSecret
 * @prop {string} twitterAccessToken
 * @prop {string} twitterAccessSecret
 * @prop {string} githubToken
 * @prop {string} twitchStreamerLogin
 * @prop {string} twitchBotLogin
 * @prop {number} videoRequestPriorityBase
 * @prop {number} videoRequestPrioritySubs
 * @prop {number} videoRequestPriorityVips
 * @prop {number} videoRequestPriorityMods
 * @prop {number} videoRequestPriorityBroadcaster
 * @prop {number} videoSubscriptionPriority
 * @prop {string|string[]} neutralTitles
 * @prop {number} secondsBetweenYoutubeChecks
 * @prop {string} githubAppPemFilePath
 * @prop {number} githubAppId
 * @prop {string} githubAppSecret
 * @prop {number} githubWebhookPort
 * @prop {string} githubUser
 * @prop {Object<string, string>} projectDependencyNames
 * @prop {number} maxTechnologiesInTitle
 * @prop {Object<string, string>} nicknames
 * @prop {string} adminPassword
 * @prop {string} twitchStreamerAccessToken
 * @prop {string} twitchStreamerRefreshToken
 * @prop {string} twitchBotAccessToken
 * @prop {string} twitchBotRefreshToken
 * @prop {number} twitchTickSeconds
 */

/**
 * @type {import("jaid-core").BaseConfig & Config}
 */
export const config = core.config

/**
 * @type {import("jaid-logger").JaidLogger}
 */
export const logger = core.logger

export default core