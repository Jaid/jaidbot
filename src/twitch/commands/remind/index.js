import parseDuration from "parse-duration"
import twitch from "src/twitch"
import {isInteger} from "lodash"

const removeFirstArgumentRegex = /^\S+\s*(?<rest>.*)/

export default {
  requiredArguments: 1,
  async handle({senderName, positionalArguments, combinedArguments}) {
    let durationMs
    if (positionalArguments[0] |> isInteger) {
      durationMs = Math.floor(parseDuration(`${positionalArguments[0]}m`))
    } else {
      durationMs = Math.floor(parseDuration(positionalArguments[0]))
    }
    let message
    const slurpedArguments = removeFirstArgumentRegex.exec(combinedArguments)
    if (slurpedArguments.groups.rest.length) {
      message = slurpedArguments.groups.rest
    }
    setTimeout(() => {
      if (message) {
        twitch.say(`${senderName}, Erinnerung an "${message}"!`)
      } else {
        twitch.say(`${senderName}, Erinnerung für dich!`)
      }
    }, durationMs)
  },
}