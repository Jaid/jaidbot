import Sequelize from "sequelize"
import twitch from "twitch"
import config from "lib/config"
import scope from "src/twitch/scope"
import logger from "lib/logger"

class TwitchUser extends Sequelize.Model {

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

  static associate(models) {
    TwitchUser.hasMany(models.ChatMessage, {
      foreignKey: {
        allowNull: false,
      },
    })
  }

  async toTwitchClient() {
    const client = await twitch.withCredentials(config.twitchClientId, this.accessToken, scope, {
      clientSecret: config.twitchClientSecret,
      refreshToken: this.refreshToken,
      onRefresh: accessToken => this.updateToken(accessToken),
    })
    logger.info("Created client for user %s", this.loginName)
    return client
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