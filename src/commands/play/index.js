import execa from "execa"
import moment from "moment"
import momentDurationFormat from "moment-duration-format"
import millify from "millify"

momentDurationFormat(moment)

export default {
  requiredArguments: 1,
  async handle({say, commandArguments, senderDisplayName}) {
    const video = commandArguments._[0]
    const execResult = await execa("E:/Projects/node-scripts/dist/exe/playVideo.exe", ["--dry", video])
    const info = execResult.stdout |> JSON.parse
    const durationString = moment.duration(info.duration, "seconds").format("h[h] m[m] s[s]")
    const viewsString = millify(info.view_count, {precision: 0})
    say(`${senderDisplayName} hat "${info.title}" (${info.height}p${info.fps}, ${durationString}, ${viewsString} Klicks) von ${info.uploader} hinzugefügt!`)
    await execa("E:/Projects/node-scripts/dist/exe/playVideo.exe", [video])
    say("Download fertig!")
  },
}