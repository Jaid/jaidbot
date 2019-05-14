import moment from "moment"

export default {
  async handle({msg, say}) {
    const hour = moment().hour()
    const greeting = (() => {
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
    })()
    say(`${greeting}, ${msg.userInfo.displayName}!`)
  },
}