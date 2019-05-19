import execa from "execa"
import vlc from "lib/vlc"

export default {
  requiredArguments: 1,
  async handle({say, commandArguments, senderDisplayName}) {
    const video = commandArguments._[0]
    const execResult = await execa("E:/Binaries/youtube-dl.exe", ["--get-title", video])
    const title = execResult.stdout
    say(`PopCorn ${senderDisplayName} hat "${title}" hinzugefügt!`)
    await execa("E:/Projects/node-scripts/dist/exe/playVideo.exe", [video])
    const vlcState = await vlc.getState()
    if (!vlcState) {
      return "Kein Lebenszeichen vom Video Player."
    }
    await vlc.sendCommand(vlcState.state === "stopped" ? "pl_play" : "pl_next")
    return "Und den Video Player habe ich wieder gestartet!"
  },
}