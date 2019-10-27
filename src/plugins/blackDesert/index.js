import twitch from "src/twitch"
import nodeSchedule from "node-schedule"

import scheduledMessages from "./schuledMessages.yml"

export default class BlackDesert {

  postInit() {
    return twitch.ready
  }

  ready() {
    for (const {cron, message} of scheduledMessages) {
      nodeSchedule.scheduleJob(cron, () => {
        twitch.notifyIfGame("black desert online", message)
      })
    }
  }

}