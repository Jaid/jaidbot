import Sequelize from "sequelize"

class User extends Sequelize.Model {}

export const schema = {
  broadcasterType: Sequelize.STRING,
  description: Sequelize.STRING,
  displayName: Sequelize.STRING,
  twitchId: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  loginName: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  offlineImageUrl: Sequelize.STRING,
  avatarUrl: Sequelize.STRING,
  viewCount: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
  accessToken: Sequelize.STRING,
  refreshToken: Sequelize.STRING,
}

export default User