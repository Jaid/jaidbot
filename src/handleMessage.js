import stringArgv from "string-argv"
import minimist from "minimist"
import {isString} from "lodash"

const commandRegex = /(?<prefix>!)(?<commandName>[\da-z]+)(?<afterCommandName>\s*(?<commandArguments>.*))?/i

const commandsRequire = require.context("./commands/", true, /index\.js$/)
const commands = commandsRequire.keys().reduce((state, value) => {
  const commandName = value.match(/\.\/(?<key>[\da-z]+)\//i).groups.key
  state[commandName] = commandsRequire(value).default
  return state
}, {})

export default (message, msg, chatClient, say) => {
  const parsedCommand = commandRegex.exec(message.trim())
  if (parsedCommand === null) {
    return
  }
  const senderDisplayName = msg.userInfo.displayName || msg.userInfo.name
  const {commandName} = parsedCommand.groups
  let commandArguments
  if (parsedCommand.groups.commandArguments) {
    commandArguments = parsedCommand.groups.commandArguments |> stringArgv |> minimist
  }
  const command = commands[commandName]
  if (!command) {
    say(`Verstehe ich jetzt nicht, ${senderDisplayName}! Alle Befehle sind in den Panels unter dem Stream beschrieben.`)
    return
  }
  if (command.requiredArguments) {
    if (!commandArguments) {
      say(`${senderDisplayName}, dieser Befehl kann nicht ohne Arguments verwendet werden!`)
      return
    }
    const givenArgumentsLength = commandArguments._.length
    if (command.requiredArguments > givenArgumentsLength) {
      say(`${senderDisplayName}, dieser Befehl benötigt ${command.requiredArguments} Arguments!`)
      return
    }
  }
  command.handle({
    msg,
    say,
    chatClient,
    commandArguments,
    senderDisplayName,
  }).then(returnValue => {
    if (returnValue |> isString) {
      say(returnValue)
    }
  }).catch(error => {
    say(`Oh, ${senderDisplayName}, irgendetwas habe ich jetzt falsch gemacht. (${error.message || error})`)
  })
}