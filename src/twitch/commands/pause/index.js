import moment from "lib/moment"
import twitch from "src/twitch"
import Video from "src/models/Video"

export default {
  permission: "mod",
  async handle() {
    const vlcState = await Video.getVlcState()
    if (!vlcState) {
      return
    }
    const command = vlcState.state === "playing" ? "pl_forcepause" : "pl_play"
    const result = await Video.sendVlcCommand(command)
    if (result) {
      const durationString = moment.duration(vlcState.time, "seconds").format()
      const answer = vlcState.state === "playing" ? `Pausiert bei ${durationString}, Bruder! Jetzt hast du deine Ruhe.` : `Geht heiter weiter an der Stelle ${durationString}!`
      twitch.say(answer)
    } else {
      twitch.say("Da hat etwas nicht geklappt")
    }
  },
}