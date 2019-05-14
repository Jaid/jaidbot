import moment from "moment"
import {template} from "lodash"

const vips = require("./vips.yml")

const getGreeting = () => {
  const hour = moment().hour()
  if (hour >= 21) {
    return "Guten Tag"
  } else if (hour >= 18) {
    return "Guten Abend"
  } else if (hour >= 13) {
    return "Guten Nachmittag"
  } else if (hour >= 11) {
    return "Guten Mittag"
  } else if (hour >= 9) {
    return "Guten Vormittag"
  } else {
    return "Guten Morgen"
  }
}

export default {
  async handle({senderDisplayName, senderUserName}) {
    const greeting = getGreeting()
    if (vips[senderUserName]) {
      return template(vips[senderUserName])({greeting})
    }
    return `${greeting}, ${senderDisplayName}!`
  },
}