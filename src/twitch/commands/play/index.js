import execa from "execa"
import vlc from "lib/vlc"
import twitch from "src/twitch"
import config from "lib/config"
import emitPromise from "emit-promise"
import server from "src/server"
import Video from "src/models/Video"

export default {
  permission: "sub-or-vip",
  needsDesktopClient: true,
  requiredArguments: 1,
  async handle({commandArguments, sender}) {
    const url = commandArguments._[0]
    const {video, videoInfo} = await Video.queueByUrl(url)
    twitch.say(`PopCorn ${sender.displayName} hat "${video.title}" hinzugefügt!`)
    server.client.emit("queueInfo", {
      videoInfo,
      videoId: video.id,
      downloadFormat: vlc.downloadFormat,
      commonParams: vlc.youtubeDlParams,
    })
  },
}