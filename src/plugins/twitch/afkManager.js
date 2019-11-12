import EventEmitter from "events"

import {logger} from "src/core"
import moment from "lib/moment"
import humanizeDuration from "lib/humanizeDuration"
import twitch from "src/plugins/twitch"
import ms from "ms.macro"

const afkToleranceMinutes = 2

function removePrefix(title) {
  return title.replace(/^\s*\[.*]\s*/, "")
}

class AfkManager extends EventEmitter {

  afkMessage = null

  afkStart = null

  afkEnd = null

  title = null

  constructor() {
    super()
    setInterval(() => {
      if (this.isAfk()) {
        this.setTitle()
      }
    }, ms`30 seconds`)
  }

  isAfk() {
    return this.afkMessage !== null
  }

  getRemainingTime() {
    return this.afkEnd - Date.now()
  }

  getTitlePrefix() {
    if (!this.isAfk()) {
      return ""
    }
    const remainingTimeMs = this.getRemainingTime()
    if (remainingTimeMs <= ms`1 minute`) {
      return "[Im Verspätungsmodus] "
    }
    const remainingTimeString = moment.duration(remainingTimeMs, "ms").format("h[h] m[m]")
    return `[Noch ${remainingTimeString} weg] `
  }

  async setTitle(title) {
    if (!twitch) {
      return
    }
    if (title) {
      this.title = title
    }
    if (!this.title) {
      const stream = await twitch.getMyStream()
      if (stream?.channel?.status) {
        this.title = removePrefix(stream.channel.status)
      }
    }
    const finalTitle = `${this.getTitlePrefix()}${this.title}`
    logger.info("New title: %s", finalTitle)
    await twitch.setTitle(finalTitle)
  }

  async activate(durationSeconds, message) {
    this.afkStart = Date.now()
    this.afkEnd = this.afkStart + durationSeconds * 1000
    this.afkMessage = message
    await this.setTitle()
    twitch.startAdLoop()
    twitch.say(`Jaidchen geht jetzt mal weg für etwa ${(durationSeconds * 1000) |> humanizeDuration}. Als Nachricht hat er lediglich ein "${message}" hinterlassen.`)
  }

  async deactivate() {
    const remainingTime = this.getRemainingTime()
    const getComment = () => {
      if (remainingTime > afkToleranceMinutes * ms`1 minute`) {
        return `Oh, der ist ja schon wieder da, ${remainingTime |> humanizeDuration} früher als angekündigt! KomodoHype`
      } else if (remainingTime > afkToleranceMinutes * -ms`1 minute`) {
        return "Da ist er ja wieder! TPFufun"
      } else {
        return `"${this.afkMessage}", ja ja. Du wolltest doch eigentlich schon seit ${remainingTime |> Math.abs |> humanizeDuration} wieder da sein. Jaidchen, wo bist du gewesen? PunOko`
      }
    }
    const comment = getComment()
    this.afkStart = null
    this.afkEnd = null
    this.afkMessage = null
    await this.setTitle()
    twitch.stopAdLoop()
    twitch.say(comment)
  }

}

export default new AfkManager