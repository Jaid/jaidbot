import afkManager from "lib/afkManager"
import parseDuration from "parse-duration"
import {isInteger} from "lodash"
import humanizeDuration from "lib/humanizeDuration"

const removeFirstArgumentRegex = /^\S+\s*(?<rest>.*)/

export default {
  requiredArguments: 1,
  async handle({streamerClient, say, positionalArguments, combinedArguments}) {
    let durationSeconds
    if (positionalArguments[0] |> isInteger) {
      durationSeconds = Math.floor(parseDuration(`${positionalArguments[0]}m`) / 1000)
    } else {
      durationSeconds = Math.floor(parseDuration(positionalArguments[0]) / 1000)
    }
    let message
    const slurpedArguments = removeFirstArgumentRegex.exec(combinedArguments)
    if (slurpedArguments.groups.rest.length) {
      message = slurpedArguments.groups.rest
    } else {
      message = "Kurz weg"
    }
    await afkManager.activate(durationSeconds, message)
  },
}