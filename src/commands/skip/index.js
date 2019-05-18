import got from "got"

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
  async handle({say}) {
    try {
      await got("http://127.0.0.1:8080/requests/status.json", {
        ...gotOptions,
      })
    } catch {
      return "Kein Lebenszeichen vom Video Player."
    }
    await got("http://127.0.0.1:8080/requests/status.json", {
      ...gotOptions,
      query: {
        command: "pl_next",
      },
    })
    say("Skippie!")
  },
}