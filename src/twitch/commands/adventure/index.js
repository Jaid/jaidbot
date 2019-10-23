import twitch from "src/twitch"
import ms from "ms.macro"

export default {
  async handle({senderName}) {
    setTimeout(() => {
      twitch.say(`${senderName}, der zweite Würfelwurf in Black Spirit's Adventure ist bereit!`)
    }, ms`61 minutes`)
    setTimeout(() => {
      twitch.say(`${senderName}, der letzte Würfelwurf in Black Spirit's Adventure ist bereit!`)
    }, ms`122 minutes`)
    return `Hoffentlich gab es keinen blöden Buff, ${senderName}!`
  },
}