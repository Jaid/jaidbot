import Sequelize from "sequelize"

class User extends Sequelize.Model {

  static associate(models) {
    User.hasMany(models.TwitchUser)
  }

  static async isSlugInUse(slug) {
    const findCount = await User.count({where: {slug}})
    return findCount !== 0
  }

}

/**
 * @type {import("sequelize").ModelAttributes}
 */
export const schema = {
  title: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  slug: {
    allowNull: false,
    type: Sequelize.STRING,
    unique: true,
  },
  color: Sequelize.STRING,
}

export default User