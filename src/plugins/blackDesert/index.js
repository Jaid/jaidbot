import nodeSchedule from "node-schedule"

import twitch from "src/plugins/twitch"

import scheduledMessages from "./scheduledMessages.yml"
import worldBossDates from "./worldBossDates.yml"
import worldBosses from "./worldBosses.yml"

const days = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export default class BlackDesert {

  postInit() {
    return twitch.isReady
  }

  ready() {
    for (const {cron, message} of scheduledMessages) {
      nodeSchedule.scheduleJob(cron, () => {
        twitch.notifyIfGame("black desert online", message)
      })
    }
    for (const {boss, notificationDate} of worldBossDates) {
      const notificationDateParsed = /(?<day>[a-z]+)\s+(?<hour>\d+):(?<minute>\d+)/.exec(notificationDate).groups
      const cron = {
        hour: notificationDateParsed.hour,
        minute: notificationDateParsed.minute,
        dayOfWeek: days[notificationDateParsed.day],
      }
      let message
      if (Array.isArray(boss)) {
        const boss1 = worldBosses[boss[0]]
        const boss2 = worldBosses[boss[1]]
        message = `In 20 Minuten kommen ${boss1.title} (${boss1.locationHint}) und ${boss2.title} (${boss2.locationHint}).`
      } else {
        const {title, locationHint} = worldBosses[boss]
        message = `In 20 Minuten kommt ${title} (${locationHint}).`
      }
      nodeSchedule.scheduleJob(cron, () => {
        twitch.notifyIfGame("black desert online", message)
      })
    }
  }

}