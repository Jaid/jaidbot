import got from "got"
import moment from "lib/moment"

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
    const currentTime = moment.duration(vlcState.time, "seconds")
    await got("http://127.0.0.1:8080/requests/status.json", {
      ...gotOptions,
      query: {
        command: "pl_next",
      },
    })
    return answer
  },
}