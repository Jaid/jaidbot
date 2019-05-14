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
  const {commandName} = parsedCommand.groups
  let commandArguments
  if (parsedCommand.groups.commandArguments) {
    commandArguments = minimist(parsedCommand.groups.commandArguments)
  }
  const command = commands[commandName]
  if (!command) {
    say("Verstehe ich jetzt nicht! Alle Befehle sind in den Panels unter dem Stream beschrieben.")
    return
  }
  command.handle({
    msg,
    say,
    chatClient,
    commandArguments,
  }).then(returnValue => {
    if (returnValue |> isString) {
      say(returnValue)
    }
  }).catch(error => {
    debugger
  })
}