import afkManager from "lib/afkManager"
import parseDuration from "parse-duration"
import {isInteger} from "lodash"
import humanizeDuration from "lib/humanizeDuration"

const removeFirstArgumentRegex = /^\S+\s*(?<rest>.*)/

export default {
  async handle() {
    if (!afkManager.isAfk()) {
      return "Jaidchen ist doch gar nicht weg. PunOko"
    }
    await afkManager.deactivate()
  },
}