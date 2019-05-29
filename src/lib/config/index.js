import essentialConfig from "essential-config"
import logger from "lib/logger"
import appdataPath from "appdata-path"

import defaultConfig from "./defaults.yml"

const config = essentialConfig(_PKG_TITLE, defaultConfig)

if (!config) {
  logger.warn("Set up default config, please edit and restart")
  process.exit(2)
}

config.appFolder = appdataPath(_PKG_TITLE)

export default config