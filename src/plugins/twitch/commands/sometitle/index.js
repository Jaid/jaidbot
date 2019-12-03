import ensureArray from "ensure-array"
import {sample} from "lodash"

import {config} from "src/core"
import afkManager from "src/plugins/twitch/afkManager"

export default {
  async handle() {
    await afkManager.updateTitle(sample(config.neutralTitles |> ensureArray))
    return "Alles klärchen!"
  },
}