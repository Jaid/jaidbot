import parseDuration from "parse-duration"

import afkManager from "src/plugins/twitch/afkManager"

const removeFirstArgumentRegex = /^\S+\s*(?<rest>.*)/

export default {
  permission: "mod",
  requiredArguments: 1,
  async handle({positionalArguments, combinedArguments}) {
    let durationSeconds
    if (Number.isInteger(positionalArguments[0])) {
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