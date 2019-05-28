/* eslint-disable promise/avoid-new, prefer-promise-reject-errors */

import twitch from "src/twitch"
import server from "src/server"

export default {
  getState() {
    return new Promise(resolve => {
      if (!server.client) {
        twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
        resolve(false)
        return
      }
      server.client.emit("getVlcState", vlcState => {
        if (vlcState === "noVlc") {
          twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
          resolve(false)
          return
        }
        resolve(vlcState)
      })
    })
  },
  getCurrentVideo() {
    return new Promise(resolve => {
      if (!server.client) {
        twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
        resolve(false)
        return
      }
      server.client.emit("getVlcVideo", videoInfo => {
        if (videoInfo === "noVlc") {
          twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
          resolve(false)
          return
        }
        if (videoInfo === "noVideo") {
          twitch.say("Anscheinend läuft gerade gar kein Video.")
          resolve(false)
          return
        }
        if (videoInfo === "videoNotOnDisk") {
          twitch.say("Das gerade laufende Video finde ich nicht im Dateisystem auf dem Computer von Jaidchen.")
          resolve(false)
          return
        }
        if (videoInfo === "noInfoFound") {
          twitch.say("Zu dem gerade laufenden Video finde ich keine Informationsunterlagen im Dateisystem auf dem Computer von Jaidchen.")
          resolve(false)
          return
        }
        resolve(videoInfo)
      })
    })
  },
  sendCommand(command, values) {
    return new Promise(resolve => {
      if (!server.client) {
        twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
        resolve(false)
        return
      }
      const commandAction = {
        command,
        ...values,
      }
      server.client.emit("sendVlcCommand", commandAction, commandResult => {
        if (commandResult === "noVlc") {
          twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
          resolve(false)
          return
        }
        if (commandResult === "commandFailed") {
          twitch.say("Die Anweisung ans Kino hat jetzt nicht so richtig geklappt.")
          resolve(false)
          return
        }
        resolve(commandResult)
      })
    })
  },
}