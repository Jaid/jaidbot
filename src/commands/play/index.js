import execa from "execa"
import moment from "moment"
import momentDurationFormat from "moment-duration-format"
import got from "got"

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
  requiredArguments: 1,
  async handle({say, commandArguments, senderDisplayName}) {
    const video = commandArguments._[0]
    const execResult = await execa("E:/Projects/node-scripts/dist/exe/playVideo.exe", ["--dry", video])
    const info = execResult.stdout |> JSON.parse
    say(`PopCorn ${senderDisplayName} hat "${info.title}" von ${info.uploader} hinzugefügt!`)
    await execa("E:/Projects/node-scripts/dist/exe/playVideo.exe", [video])
    say(info.downloadFileExists ? "Download nicht nötig!" : "Download fertig!")
    let vlcState
    try {
      const {body} = await got("http://127.0.0.1:8080/requests/status.json", gotOptions)
      vlcState = body
    } catch (error) {
      return "Kein Lebenszeichen vom Video Player."
    }
    if (vlcState.state === "stopped") {
      await got("http://127.0.0.1:8080/requests/status.json", {
        ...gotOptions,
        query: {
          command: "pl_play",
        },
      })
      await got("http://127.0.0.1:8080/requests/status.json", {
        ...gotOptions,
        query: {
          command: "pl_next",
        },
      })
      return "Und den Video Player habe ich wieder gestartet!"
    }
  },
}