import parseDuration from "parse-duration"

import ScheduledMessage from "src/models/ScheduledMessage"

const removeFirstArgumentRegex = /^\S+\s*(?<rest>.*)/

export default {
  requiredArguments: 1,
  async handle({senderName, positionalArguments, combinedArguments}) {
    let durationMs
    if (Number.isInteger(positionalArguments[0])) {
      durationMs = Math.floor(parseDuration(`${positionalArguments[0]}m`))
    } else {
      durationMs = Math.floor(parseDuration(positionalArguments[0]))
    }
    let customMessage
    const slurpedArguments = removeFirstArgumentRegex.exec(combinedArguments)
    if (slurpedArguments.groups.rest.length) {
      customMessage = slurpedArguments.groups.rest
    }
    let message
    if (customMessage) {
      message = `${senderName}, Erinnerung: ${customMessage}`
    } else {
      message = `${senderName}, Erinnerung für dich!`
    }
    await ScheduledMessage.addForDelay(durationMs, message)
    return `Erinnerung gespeichert, ${senderName}!`
  },
}