import execa from "execa"
import vlc from "lib/vlc"
import twitch from "src/twitch"
import config from "lib/config"
import emitPromise from "emit-promise"
import server from "src/server"

export default {
  permission: "sub-or-vip",
  needsDesktopClient: true,
  requiredArguments: 1,
  async handle({commandArguments, sender}) {
    const video = commandArguments._[0]
    const execResult = await execa(config.youtubeDl.path, [...vlc.youtubeDlParams, "--dump-single-json", video])
    const videoInfo = execResult.stdout |> JSON.parse
    twitch.say(`PopCorn ${sender.displayName} hat "${videoInfo.title}" hinzugefügt!`)
    await emitPromise(server.client, "queueInfo", {
      videoInfo,
      commonParams: vlc.youtubeDlParams,
    })
    twitch.say(`PopCorn "${videoInfo.title}" ist jetzt heruntergeladen!`)
    // await execa("E:/Projects/node-scripts/dist/exe/playVideo.exe", [video])
    // const vlcState = await vlc.getState()
    // if (!vlcState) {
    //   return "Kein Lebenszeichen vom Video Player."
    // }
  },
}