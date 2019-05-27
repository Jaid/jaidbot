import moment from "lib/moment"
import vlc from "lib/vlc"
import server from "src/server"
import twitch from "src/twitch"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    server.client.emit("getVlcState", state => {
      twitch.say("State")
    })
    // const vlcState = await vlc.getState()
    // if (!vlcState) {
    //   return "Kein Lebenszeichen vom Video Player."
    // }
    // const durationString = moment.duration(vlcState.time, "seconds").format()
    // const command = vlcState.state === "playing" ? "pl_forcepause" : "pl_play"
    // const answer = vlcState.state === "playing" ? `Pausiert bei ${durationString}, Bruder! Jetzt hast du deine Ruhe.` : `Geht heiter weiter an der Stelle ${durationString}!`
    // await vlc.sendCommand(command)
    // return answer
  },
}