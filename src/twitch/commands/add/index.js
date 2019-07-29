import twitch from "src/twitch"
import config from "lib/config"
import Video from "src/models/Video"

export default {
  permission: "sub-or-vip",
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
    const video = await Video.queueByUrl(url, {
      priority,
      requesterTwitchId: sender.id,
    })
    twitch.say(`PopCorn ${sender.displayName} hat "${video.title}" hinzugefügt! (Priorität: ${priority})`)
  },
}