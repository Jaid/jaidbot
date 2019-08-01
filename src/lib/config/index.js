import essentialConfig from "essential-config"
import logger from "lib/logger"

import defaults from "./defaults.yml"

const configResult = essentialConfig(_PKG_TITLE, {
  defaults,
  sensitiveKeys: [
    "serverPassword",
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
    "databasePassword",
  ],
})

/**
 * @typedef {string|string[]} HiMessage
 */

/**
 * @typedef {Object} ObservedYoutubeChannel
 * @prop {string} name
 * @prop {string} id
 * @prop {number} priority
 * @prop {string} titleRegex
 */

/**
 * @typedef {Object} WatchedSteamDepotId
 * @prop {string} name
 * @prop {string} id
 */

/**
 * @typedef {Object} Config
 * @prop {string} databaseHost
 * @prop {string} databaseName
 * @prop {string} databaseUser
 * @prop {number} databasePort
 * @prop {string} databasePassword
 * @prop {"sync"|"force"|"alter"|"none"} databaseSchemaSync
 * @prop {number} serverPort
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
 * @prop {number} twitchAuthPort
 * @prop {string} twitchClientCallbackUrl
 * @prop {string} databaseHost
 * @prop {number} databasePort
 * @prop {string} databaseName
 * @prop {string} databaseUser
 * @prop {string} databaseSchemaSync
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
 * @prop {string} databasePassword
 * @prop {string} twitchStreamerLogin
 * @prop {string} twitchBotLogin
 * @prop {string} timezone
 * @prop {number} videoRequestPriorityBase
 * @prop {number} videoRequestPrioritySubs
 * @prop {number} videoRequestPriorityVips
 * @prop {number} videoRequestPriorityMods
 * @prop {number} videoRequestPriorityBroadcaster
 * @prop {number} videoSubscriptionPriority
 * @prop {string|string[]} neutralTitles
 * @prop {number} secondsBetweenYoutubeChecks
 * @prop {number} videoSubscriptionAddDelaySeconds
 */

/**
 * @type {Config}
 */
const config = configResult.config

if (!config) {
  logger.warn("Set up default config, please edit and restart")
  process.exit(2)
}

/**
 * @type {string}
 */
export const appFolder = config.configFolder

export default config