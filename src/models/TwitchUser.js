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
   */
  static async findOrRegisterById(twitchId, options) {
    return TwitchUser.findOrRegister({
      ...options,
      key: "twitchId",
      value: twitchId,
    })
  }

  /**
   * @async
   * @function
   * @param {string} twitchLogin
   * @param {Object} [options]
   */
  static async findOrRegisterByLogin(twitchLogin, options) {
    return TwitchUser.findOrRegister({
      ...options,
      key: "twitchLogin",
      value: twitchLogin,
    })
  }

  /**
   * @async
   * @function
   * @param {string} twitchLogin
   * @param {Object} [options]
   * @param {string[]} options.attributes
   * @param {Object<string, *>} options.defaults
   * @param {"twitchLogin"|"twitchId"} [options.key="twitchLogin"]
   * @param {string} options.value
   */
  static async findOrRegister({key = "twitchLogin", value, attributes, defaults}) {
    const keyMeta = {
      twitchLogin: {
        searchColumn: "loginName",
        fetchUser: twitchCore.getUserInfoByTwitchLogin,
      },
      twitchId: {
        searchColumn: "twitchId",
        fetchUser: twitchCore.getUserInfoByTwitchId,
      },
    }
    const twitchUser = await TwitchUser.findOne({
      where: {[keyMeta[key].searchColumn]: value},
      attributes,
    })
    if (twitchUser) {
      return twitchUser
    }
    const helixUser = await keyMeta[key].fetchUser(value)
    const displayName = helixUser.displayName || helixUser.name
    logger.info("New Twitch user %s", displayName)
    const newTwitchUser = await TwitchUser.create({
      displayName,
      twitchId: helixUser.id,
      description: helixUser.description,
      loginName: helixUser.name.toLowerCase(),
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
  chatterRole: {
    allowNull: false,
    type: Sequelize.STRING,
    defaultValue: "viewers",
  },
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