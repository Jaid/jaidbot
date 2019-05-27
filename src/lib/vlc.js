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
        if (!vlcState) {
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
      server.client.emit("getVlcVideo", vlcState => {
        if (!vlcState) {
          twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
          resolve(false)
          return
        }
        resolve(vlcState)
      })
    })
  },
}