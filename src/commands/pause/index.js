import got from "got"
import moment from "moment"
import momentDurationFormat from "moment-duration-format"

momentDurationFormat(moment)

const gotOptions = {
  auth: ":1",
  throwHttpErrors: false,
  retry: {
    retries: 1,
    errorCodes: ["ETIMEDOUT", " ECONNRESET", "EADDRINUSE", "EPIPE", "ENOTFOUND", "ENETUNREACH", "EAI_AGAIN"],
  },
  json: true,
}

export default {
  async handle() {
    let vlcState
    try {
      const {body} = await got("http://127.0.0.1:8080/requests/status.json", {
        ...gotOptions,
      })
      vlcState = body
    } catch {
      return "Kein Lebenszeichen vom Video Player."
    }
    const durationString = moment.duration(vlcState.time, "seconds").format()
    const command = vlcState.state === "playing" ? "pl_forcepause" : "pl_play"
    const answer = vlcState.state === "playing" ? `Pausiert bei ${durationString}, Bruder! Jetzt hast du deine Ruhe.` : `Geht heiter weiter an der Stelle ${durationString}!`
    await got("http://127.0.0.1:8080/requests/status.json", {
      ...gotOptions,
      query: {command},
    })
    return answer
  },
}