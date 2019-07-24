import vlc from "lib/vlc"
import twitch from "src/twitch"
import config from "lib/config"
import server from "src/server"
import Video from "src/models/Video"

export default {
  permission: "sub-or-vip",
  needsDesktopClient: true,
  requiredArguments: 1,
  async handle({commandArguments, sender}) {
    const url = commandArguments._[0]
    let priority = config.videoRequestPriorityBase
    if (sender.isSub) {
      priority += config.videoRequestPrioritySubs
    }
    if (sender.isVip) {
      priority += config.videoRequestPriorityVips
    }
    if (sender.isMod) {
      priority += config.videoRequestPriorityMods
    }
    if (sender.isBroadcaster) {
      priority += config.videoRequestPriorityBroadcaster
    }
    const {video, videoInfo} = await Video.queueByUrl(url, {
      priority,
      requesterTwitchId: sender.id,
    })
    twitch.say(`PopCorn ${sender.displayName} hat "${video.title}" hinzugefügt! (Priorität: ${priority})`)
    server.client.emit("queueInfo", {
      videoInfo,
      videoId: video.id,
      downloadFormat: vlc.downloadFormat,
      commonParams: vlc.youtubeDlParams,
    })
  },
}