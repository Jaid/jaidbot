import moment from "lib/moment"

import Video from "src/models/Video"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const vlcState = await Video.getVlcState()
    if (!vlcState) {
      return
    }
    const shouldPause = vlcState.state === "playing"
    if (shouldPause) {
      const result = await Video.sendVlcCommand("pl_forcepause")
      if (!result) {
        return "Da hat etwas nicht geklappt"
      }
      const durationString = moment.duration(vlcState.time, "seconds").format()
      return `PopCorn Pausiert bei ${durationString}, Bruder! Jetzt hast du deine Ruhe.`
    } else {
      const result = await Video.sendVlcCommand("pl_play")
      if (!result) {
        return "Da hat etwas nicht geklappt"
      }
      const newTimeSeconds = Math.max(vlcState.time - 3, 0)
      await Video.sendVlcCommand("seek", { // https://wiki.videolan.org/VLC_HTTP_requests
        val: "-3s",
      })
      const durationString = moment.duration(newTimeSeconds, "seconds").format()
      return `PopCorn Geht heiter weiter an der Stelle ${durationString}!`
    }
  },
}