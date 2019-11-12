import {config} from "src/core"
import {sample} from "lodash"
import afkManager from "src/plugins/twitch/afkManager"
import ensureArray from "ensure-array"

export default {
  async handle() {
    await afkManager.setTitle(sample(config.neutralTitles |> ensureArray))
    return "Alles klärchen!"
  },
}