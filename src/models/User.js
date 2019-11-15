import Sequelize from "sequelize"

class TwitchUser extends Sequelize.Model {

  static associate(models) {
    // TwitchUser.hasMany(models.ChatMessage, {
    //   foreignKey: {
    //     allowNull: false,
    //   },
    // })
    // TwitchUser.hasMany(models.Video, {
    //   as: "RequestedVideos",
    //   foreignKey: "RequesterId",
    // })
  }

}

export const schema = {
  title: {
    allowNull: false,
    type: Sequelize.STRING,
  },
}

export default TwitchUser