import twitch from "src/twitch"
import ms from "ms.macro"

export default {
  permission: "mod",
  async handle() {
    setTimeout(() => {
      twitch.say("Der zweite Würfelwurf in Black Spirit's Adventure ist bereit!")
    }, ms`61 minutes`)
    setTimeout(() => {
      twitch.say("Der letzte Würfelwurf in Black Spirit's Adventure ist bereit!")
    }, ms`122 minutes`)
    return "Hoffentlich gab es keinen blöden Buff!"
  },
}