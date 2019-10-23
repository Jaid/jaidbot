import {hoursMinutesHumanize} from "lib/humanizeDuration"
import main from "src/plugins/main"

export default {
  async handle({senderName}) {
    if (!main.currentProject) {
      return "Für diese Session hat Jaidchen noch kein Projekt festgelegt."
    }
    const workingDuration = Date.now() - main.projectSetDate
    const workingDurationString = hoursMinutesHumanize(workingDuration)
    if (!main.currentProjectRepo) {
      return `Jaidchen ist seit ${workingDurationString} mit ${main.currentProject} beschäftigt, ${senderName}.`
    }

    return `Jaidchen ist seit ${workingDurationString} mit ${main.currentProject} beschäftigt. Das Projekt ist öffentlich auf github.com/${main.currentProjectRepo} einsehbar. Da kannst du, falls du einen GitHub-Account hast, ${senderName}, das Projekt mit einem Stern markieren, einen Fehler melden, Vorschläge eintragen oder auch Änderungen am Code einreichen.`
  },
}