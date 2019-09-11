import EventEmitter from "events"

import stringArgv from "string-argv"
import minimist from "minimist"
import {isString, pick} from "lodash"
import twitch from "src/twitch"
import server from "src/plugins/apiServer"
import {logger} from "src/core"
import ensureArray from "ensure-array"
import {isEmpty} from "has-content"

const commandRegex = /^(?<prefix>!)(?<commandName>[\da-z]+)(?<afterCommandName>\s*(?<commandArguments>.*))?/i

const commandsRequire = require.context("./commands/", true, /index\.js$/)

export default class ChatBot extends EventEmitter {

  constructor() {
    super()
    this.commands = commandsRequire.keys().reduce((state, value) => {
      const commandName = value.match(/\.\/(?<key>[\da-z]+)\//i).groups.key
      state[commandName] = commandsRequire(value).default
      return state
    }, {})
    this.commandUsages = []
    for (const [commandName, command] of Object.entries(this.commands)) {
      const help = require(`./commands/${commandName}/help.yml`)
      if (isEmpty(help)) {
        continue
      }
      const helpEntries = ensureArray(help)
      for (const helpEntry of helpEntries) {
        const normalizedHelpEntry = {
          command: commandName,
          description: helpEntry.description,
        }
        if (helpEntry.param) {
          const params = ensureArray(helpEntry.param)
          normalizedHelpEntry.params = params
          normalizedHelpEntry.usage = `!${commandName} ${params.join(" ")}`
        } else {
          normalizedHelpEntry.usage = `!${commandName}`
        }
        if (helpEntry.example) {
          normalizedHelpEntry.example = ensureArray(helpEntry.example)
        }
        Object.assign(normalizedHelpEntry, pick(command, "permission", "needsDesktopClient", "requiredArguments"))
        this.commandUsages.push(normalizedHelpEntry)
      }
    }
  }

  handleMessage(message) {
    const parsedCommand = commandRegex.exec(message.text)
    if (parsedCommand === null) {
      return
    }
    const commandName = parsedCommand.groups.commandName.toLowerCase()
    let commandArguments
    let positionalArguments
    if (parsedCommand.groups.commandArguments) {
      commandArguments = parsedCommand.groups.commandArguments |> stringArgv |> minimist
      positionalArguments = commandArguments._
    }
    const command = this.commands[commandName]
    if (!command) {
      twitch.say(`Verstehe ich jetzt nicht, ${message.sender.displayName}! Alle Befehle sind in den Panels unter dem Stream beschrieben.`)
      return
    }
    if (!message.sender.isBroadcaster) {
      if (command.permission === "sub-or-vip" && !message.sender.isVip && !message.sender.isSub && !message.sender.isMod) {
        twitch.say(`${message.sender.displayName}, für diesen Befehl musst du Moderator, Subscriber oder VIP sein!`)
        return
      }
      if (command.permission === "mod" && !message.sender.hasElevatedPermission) {
        twitch.say(`${message.sender.displayName}, für diesen Befehl musst du Moderator sein!`)
        return
      }
    }
    if (command.needsDesktopClient && !server.hasClient()) {
      twitch.say(`Es besteht gerade keine Verbindung zum Computer von ${twitch.streamerUser.getDisplayName()}. ResidentSleeper`)
      return
    }
    if (command.requiredArguments) {
      if (!commandArguments) {
        twitch.say(`${message.sender.displayName}, dieser Befehl kann nicht ohne Arguments verwendet werden!`)
        return
      }
      const givenArgumentsLength = positionalArguments.length
      if (command.requiredArguments > givenArgumentsLength) {
        twitch.say(`${message.sender.displayName}, dieser Befehl benötigt ${command.requiredArguments} Arguments!`)
        return
      }
    }
    command.handle({
      ...message,
      commandArguments,
      positionalArguments: positionalArguments || [],
      combinedArguments: parsedCommand?.groups?.commandArguments,
    }).then(returnValue => {
      if (returnValue |> isString) {
        twitch.say(returnValue)
      }
    }).catch(error => {
      logger.error("Error at execution of \"%s\": %s", message.text, error)
      twitch.say(`Oh, ${message.sender.displayName}, da hat irgendetwas nicht geklappt. Muss sich ${twitch.streamerUser.getDisplayName()} drum kümmern.`)
    })
  }

}