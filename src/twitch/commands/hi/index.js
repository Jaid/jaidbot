import moment from "lib/moment"
import {template, sample, isArray} from "lodash-es"
import config from "lib/config"
import twitch from "src/twitch"

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
      userName = positionalArguments[0].toLowerCase()
      displayName = await twitch.userNameToDisplayName(userName)
    } else {
      if (sender.isBroadcaster) {
        return "Testest du mich schon wieder? cmonBruh"
      }
      userName = sender.name
      displayName = sender.displayName
    }
    const hiMessage = config.hiMessages[userName]
    if (hiMessage) {
      const customMessage = isArray(hiMessage) ? sample(hiMessage) : hiMessage
      return template(customMessage)({greeting})
    }
    const vipString = sender.isVip ? "höchstgeachteter " : ""
    return `${greeting}, ${vipString}${displayName}!`
  },
}