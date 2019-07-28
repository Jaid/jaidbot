import twitch from "src/twitch"
import server from "src/server"
import emitPromise from "emit-promise"
import config from "lib/config"

const downloadFormat = config.youtubeDlFormat

export default {
  downloadFormat,
  async getState() {
    if (!server.client) {
      twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
      return
    }
    const vlcState = await emitPromise.withDefaultTimeout(server.client, "getVlcState")
    if (vlcState === "noVlc") {
      twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
      return
    }
    return vlcState
  },
  async getCurrentVideo() {
    if (!server.client) {
      twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
      return
    }
    const videoInfo = await emitPromise.withDefaultTimeout(server.client, "getVlcVideo")
    if (videoInfo === "noVlc") {
      twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
      return
    }
    if (videoInfo === "noVideo") {
      twitch.say("Anscheinend läuft gerade gar kein Video.")
      return
    }
    if (videoInfo === "videoNotOnDisk") {
      twitch.say("Das gerade laufende Video finde ich nicht im Dateisystem auf dem Computer von Jaidchen.")
      return
    }
    if (videoInfo === "noInfoFound") {
      twitch.say("Zu dem gerade laufenden Video finde ich keine Informationsunterlagen im Dateisystem auf dem Computer von Jaidchen.")
      return
    }
    return videoInfo
  },
  async getCurrentYoutubeVideo() {
    const info = await this.getCurrentVideo()
    if (!info?.videoInfo) {
      return
    }
    if (info.videoInfo.extractor !== "youtube") {
      twitch.say("Beim abgespielten Video scheint es sich nicht um ein YouTube-Video zu handeln.")
      return
    }
    return info
  },
  async sendCommand(command, values) {
    if (!server.client) {
      twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
      return
    }
    const commandAction = {
      command,
      ...values,
    }
    const commandResult = await emitPromise.withDefaultTimeout(server.client, "sendVlcCommand", commandAction)
    if (commandResult === "noVlc") {
      twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
      return
    }
    if (commandResult === "commandFailed") {
      twitch.say("Die Anweisung ans Kino hat jetzt nicht so richtig geklappt.")
      return
    }
    return commandResult
  },
  youtubeDlParams: [
    "--no-color",
    "--ignore-config",
    "--abort-on-error",
    "--netrc",
    "--format",
    downloadFormat,
    "--cookies",
    config.youtubeDlCookieFile,
  ],
}