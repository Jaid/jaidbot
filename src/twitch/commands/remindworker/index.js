import ms from "ms.macro"
import ScheduledMessage from "src/models/ScheduledMessage"

export default {
  async handle({senderName}) {
    await ScheduledMessage.addForDelay(ms`9 minutes`, `${senderName}, in einer Minute kommt der Worker!`)
    await ScheduledMessage.addForDelay(ms`595 seconds`, `${senderName}, der Worker ist da!`)
    return `In 10 Minuten lässt sich der Worker beim Supervisor erwerben. Ich sage noch mal rechtzeitig Bescheid, ${senderName}!`
  },
}