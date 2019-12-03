import ms from "ms.macro"

import ScheduledMessage from "src/models/ScheduledMessage"

export default {
  async handle({senderName}) {
    await ScheduledMessage.addForDelay(ms`61 minutes`, `${senderName}, der zweite Würfel in Black Spirit's Adventure ist bereit!`)
    await ScheduledMessage.addForDelay(ms`122 minutes`, `${senderName}, der dritte Würfel in Black Spirit's Adventure ist bereit!`)
    return `Hoffentlich gab es keinen blöden Buff, ${senderName}!`
  },
}