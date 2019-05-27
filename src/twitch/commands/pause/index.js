import moment from "lib/moment"
import server from "src/server"
import twitch from "src/twitch"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle({sender}) {
    server.client.emit("getVlcState", vlcState => {
      if (!vlcState) {
        twitch.say(`Kein Lebenszeichen aus dem Kino. Sorry, ${sender.displayName}!`)
        return
      }
      const durationString = moment.duration(vlcState.time, "seconds").format()
      const command = vlcState.state === "playing" ? "pl_forcepause" : "pl_play"
      const answer = vlcState.state === "playing" ? `Pausiert bei ${durationString}, Bruder! Jetzt hast du deine Ruhe.` : `Geht heiter weiter an der Stelle ${durationString}!`
      server.client.emit("sendVlcCommand", command, null, result => {
        if (result) {
          twitch.say(answer)
        } else {
          twitch.say("Da hat etwas nicht geklappt")
        }
      })
    })
  },
}