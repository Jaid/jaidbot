import ms from "ms.macro"
import pTimeout from "p-timeout"
import Sequelize from "sequelize"
import shortid from "shortid"
import twitch from "twitch"
import ChatClient from "twitch-chat-client"

import {config, logger} from "src/core"
import ChatMessage from "src/models/ChatMessage"
import User from "src/models/User"
import twitchCore from "src/plugins/twitch"
import scope from "src/plugins/twitchAuth/scope"

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
    TwitchUser.belongsTo(models.User, {
      foreignKey: {
        allowNull: false,
      },
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
        fetchUser: twitchLogin => twitchCore.getUserInfoByTwitchLogin(twitchLogin),
      },
      twitchId: {
        searchColumn: "twitchId",
        fetchUser: twitchId => twitchCore.getUserInfoByTwitchId(twitchId),
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
    if (!helixUser) {
      throw new Error("Could not fetch a user")
    }
    const login = helixUser.name.toLowerCase()
    const displayName = helixUser.displayName || login
    if (key === "twitchLogin") {
      const twitchUserWithSameId = await TwitchUser.findOne({
        where: {twitchId: helixUser.id},
      })
      if (twitchUserWithSameId) {
        logger.info("Twitch user #%s seems to have been renamed from %s to %s", twitchUserWithSameId.id, twitchUserWithSameId.loginName, value)
        twitchUserWithSameId.loginName = value
        twitchUserWithSameId.displayName = displayName
        await twitchUserWithSameId.save()
        return twitchUserWithSameId
      }
    }
    logger.info("New Twitch user %s", displayName)
    const isNameSlugUsed = await User.isSlugInUse(login)
    let newSlug = login
    if (isNameSlugUsed) {
      newSlug = shortid.generate()
      logger.warn("Can not use %s for user slug, because is it already in use, using random slug %s instead", login, newSlug)
    }
    const newTwitchUser = await TwitchUser.create({
      displayName,
      twitchId: helixUser.id,
      description: helixUser.description,
      loginName: login,
      offlineImageUrl: helixUser.offlinePlaceholderUrl,
      avatarUrl: helixUser.profilePictureUrl,
      viewCount: helixUser.views,
      broadcasterType: helixUser.broadcasterType,
      User: {
        title: displayName,
        color: defaults?.nameColor,
        slug: newSlug,
      },
      ...defaults,
    }, {include: "User"})
    return newTwitchUser
  }

  static start() {
    ChatMessage.afterCreate(async chatMessage => {
      const twitchUser = await TwitchUser.findByPk(chatMessage.TwitchUserId, {
        attributes: ["id", "nameColor"],
      })
      if (!twitchUser.nameColor && chatMessage.nameColor) {
        logger.info("Received name color of %s for the first time", chatMessage.senderDisplayName)
        twitchUser.nameColor = chatMessage.nameColor
      } else if (twitchUser.nameColor !== chatMessage.nameColor) {
        logger.info("%s seems to have changed the name color from %s to %s", chatMessage.senderDisplayName, twitchUser.nameColor, chatMessage.nameColor)
        twitchUser.nameColor = chatMessage.nameColor
      }
      await twitchUser.save()
    })
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
    const waitForRegister = new Promise(resolve => {
      const listener = chatClient.onRegister(() => {
        chatClient.removeListener(listener)
        resolve({
          apiClient,
          chatClient,
        })
      })
    })
    return pTimeout(waitForRegister, ms`30 seconds`)
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