import execa from "execa"

export default {
  requiredArguments: 1,
  async handle({commandArguments, senderDisplayName}) {
    const video = commandArguments._[0]
    const execResult = await execa("E:/Binaries/youtube-dl.exe", ["--netrc", "--dump-single-json", video])
    const info = execResult.stdout |> JSON.parse
    return `${senderDisplayName}, du hast das Video "${info.title}" (${info.height}p${info.fps}) von ${info.uploader} hinzugefügt!`
  },
}