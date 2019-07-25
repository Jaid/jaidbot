import config from "lib/config"
import {Sequelize} from "sequelize"
import logger from "lib/logger"
import sortKeys from "sort-keys"

/**
 * @type {import("sequelize").Sequelize}
 */
const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.databaseHost,
  port: config.databasePort,
  database: config.databaseName,
  username: config.databaseUser,
  password: config.databasePassword,
  timezone: config.timezone,
  logging: line => {
    logger.debug(line)
  },
})

sequelize.loadModels = () => {
  const modelsRequire = require.context("../models/", true, /.js$/)
  for (const value of modelsRequire.keys()) {
    const modelName = value.match(/\.\/(?<key>[\da-z]+)\./i).groups.key
    const {schema, indexes, default: modelClass} = modelsRequire(value)
    modelClass.init(schema |> sortKeys, {
      sequelize,
      modelName,
      indexes,
    })
  }
}

export default sequelize