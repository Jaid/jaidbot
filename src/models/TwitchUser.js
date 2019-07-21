import Sequelize from "sequelize"

class User extends Sequelize.Model {

  static async getByTwitchId(twitchId) {
    const user = await User.findOne({
      where: {
        twitchId,
      },
    })
    return user
  }

}

export const schema = {
  broadcasterType: Sequelize.STRING,
  description: Sequelize.STRING,
  twitchId: {
    type: Sequelize.STRING(16),
    unique: true,
    allowNull: false,
  },
  displayName: Sequelize.STRING(64),
  loginName: {
    allowNull: false,
    type: Sequelize.STRING,
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

export default User