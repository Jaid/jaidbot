import moment from "lib/moment"
import {template, sample, isArray} from "lodash"
import {config} from "src/core"
import twitch from "src/twitch"
import normalizeUsername from "lib/normalizeUsername"

const getGreeting = () => {
  const hour = moment().hour()
  if (hour >= 21) {
    return "HeyGuys Guten Tag"
  } else if (hour >= 18) {
    return "HeyGuys Guten Abend"
  } else if (hour >= 13) {
    return "HeyGuys Guten Nachmittag"
  } else if (hour >= 11) {
    return "HeyGuys Guten Mittag"
  } else if (hour >= 9) {
    return "HeyGuys Guten Vormittag"
  } else {
    return "HeyGuys Guten Morgen"
  }
}

export default {
  async handle({sender, positionalArguments}) {
    const greeting = getGreeting()
    let userName
    let displayName
    if (positionalArguments[0]) {
      userName = positionalArguments[0] |> normalizeUsername
      displayName = await twitch.userNameToDisplayName(userName)
    } else {
      if (sender.isBroadcaster) {
        return "Testest du mich schon wieder? cmonBruh"
      }
      userName = sender.name
      displayName = sender.displayName
      if (sender.isVip) {
        displayName = `höchstgeachteter Ehrenhase ${displayName}`
      }
    }
    const hiMessage = config.hiMessages[userName]
    if (hiMessage) {
      const customMessage = isArray(hiMessage) ? sample(hiMessage) : hiMessage
      return template(customMessage)({greeting})
    }
    return `${greeting}, ${displayName}!`
  },
}