import Sequelize from "sequelize"
import twitch from "twitch"
import twitchCore from "src/plugins/twitch"
import {config, logger} from "src/core"
import scope from "src/plugins/twitchAuth/scope"
import ChatClient from "twitch-chat-client"

class TwitchUser extends Sequelize.Model {

  static associate(models) {
    TwitchUser.hasMany(models.ChatMessage, {
      foreignKey: {
        allowNull: false,
      },
    })
    TwitchUser.hasMany(models.Video, {
      as: "RequestedVideos",
      foreignKey: "RequesterId",
    })
  }

  static async getByTwitchId(twitchId) {
    const user = await TwitchUser.findOne({
      where: {twitchId},
    })
    return user
  }

  /**
   * @async
   * @param {string} twitchLogin
   * @return {TwitchUser}
   */
  static async getByTwitchLogin(twitchLogin) {
    const user = await TwitchUser.findOne({
      where: {
        loginName: twitchLogin.toLowerCase(),
      },
    })
    return user
  }

  /**
   * @async
   * @function
   * @param {string} twitchId
   * @param {Object} [options]
   * @param {string[]} options.attributes
   * @param {Object<string, *>} options.defaults
   */
  static async prepareByTwitchId(twitchId, {attributes, defaults}) {
    const twitchUser = await TwitchUser.findOne({
      where: {twitchId},
      attributes,
    })
    if (twitchUser) {
      return twitchUser
    }
    const helixUser = await twitchCore.getChannelInfo(twitchId)
    const displayName = helixUser.displayName || helixUser.name
    logger.info("New Twitch user %s", displayName)
    const newTwitchUser = await TwitchUser.create({
      twitchId,
      displayName,
      description: helixUser.description,
      loginName: helixUser.name,
      offlineImageUrl: helixUser.offlinePlaceholderUrl,
      avatarUrl: helixUser.profilePictureUrl,
      viewCount: helixUser.views,
      broadcasterType: helixUser.broadcasterType,
      ...defaults,
    })
    return newTwitchUser
  }

  async toTwitchClient() {
    const client = await twitch.withCredentials(config.twitchClientId, this.accessToken, scope, {
      clientSecret: config.twitchClientSecret,
      refreshToken: this.refreshToken,
      onRefresh: accessToken => this.updateToken(accessToken),
      expiry: this.tokenExpiryDate,
    }, {
      preAuth: true,
      initialScopes: scope,
    })
    if (!this.tokenExpiryDate) {
      logger.info("Initial expiry date not set for user %s. Forcing access token refresh.", this.loginName)
      await client.refreshAccessToken()
    }
    logger.info("Created client for user %s", this.loginName)
    return client
  }

  async toTwitchClientWithChat() {
    const apiClient = await this.toTwitchClient()
    const chatClient = await ChatClient.forTwitchClient(apiClient)
    await chatClient.connect()
    await chatClient.waitForRegistration()
    return {
      apiClient,
      chatClient,
    }
  }

  /**
   * @async
   * @function
   * @param {import("twitch").AccessToken} token
   */
  async updateToken(token) {
    logger.info("Refresh token of user %s", this.loginName)
    this.accessToken = token.accessToken
    this.refreshToken = token.refreshToken
    this.tokenExpiryDate = token.expiryDate
    await this.save({
      fields: ["accessToken", "refreshToken", "tokenExpiryDate"],
    })
  }

  getDisplayName() {
    return this.displayName || this.loginName || this.twitchId
  }

}

export const schema = {
  broadcasterType: Sequelize.STRING(16),
  description: Sequelize.STRING,
  twitchId: {
    type: Sequelize.STRING(16),
    unique: true,
    allowNull: false,
  },
  nameColor: Sequelize.STRING,
  displayName: Sequelize.STRING(64),
  loginName: {
    allowNull: false,
    type: Sequelize.STRING(64),
  },
  offlineImageUrl: Sequelize.TEXT,
  avatarUrl: Sequelize.TEXT,
  viewCount: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
  accessToken: Sequelize.STRING,
  refreshToken: Sequelize.STRING,
  followDate: Sequelize.DATE,
  tokenExpiryDate: Sequelize.DATE,
  offlineTimeMinutes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  liveWatchTimeMinutes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  vodcastWatchTimeMinutes: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
}

export default TwitchUser