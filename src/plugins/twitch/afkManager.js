import EventEmitter from "events"
import ms from "ms.macro"

import humanizeDuration from "lib/humanizeDuration"
import moment from "lib/moment"

import apiServer from "src/plugins/apiServer"
import twitch, {removeTitlePrefix} from "src/plugins/twitch"

const afkToleranceMinutes = 2

class AfkManager extends EventEmitter {

  afkMessage = null

  afkStart = null

  afkEnd = null

  title = null

  constructor() {
    super()
    setInterval(() => {
      if (this.isAfk()) {
        this.updateTitle()
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
    if (remainingTimeMs < -ms`1 minute`) {
      const passedTimeString = moment.duration(-remainingTimeMs, "ms").format("h[h] m[m]")
      return `[Schon ${passedTimeString} länger weg als angesagt] `
    }
    if (remainingTimeMs > ms`1 minute`) {
      const remainingTimeString = moment.duration(remainingTimeMs, "ms").format("h[h] m[m]")
      return `[In ${remainingTimeString} wieder da] `
    }
    return "[Demnächst zurück] "
  }

  async updateTitle() {
    const currentTitle = removeTitlePrefix(twitch.currentTitle)
    await twitch.setTitle(`${this.getTitlePrefix()}${currentTitle}`)
  }

  async activate(durationSeconds, message) {
    this.afkStart = Date.now()
    this.afkEnd = this.afkStart + durationSeconds * 1000
    this.afkMessage = message
    apiServer.client?.emit("startAfk", {
      start: this.afkStart,
      end: this.afkEnd,
      message: this.afkMessage,
    })
    await this.updateTitle()
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
    await this.updateTitle()
    twitch.stopAdLoop()
    twitch.say(comment)
  }

}

export default new AfkManager