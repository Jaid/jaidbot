import config from "lib/config"
import {sample} from "lodash"
import afkManager from "src/twitch/afkManager"
import ensureArray from "ensure-array"

export default {
  async handle() {
    await afkManager.setTitle(sample(config.neutralTitles |> ensureArray))
    return "Alles klärchen!"
  },
}