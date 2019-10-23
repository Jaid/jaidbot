import twitch from "src/twitch"
import {config} from "src/core"
import Video from "src/models/Video"

export default {
  permission: "subOrVip",
  requiredArguments: 1,
  async handle({commandArguments, sender, senderName}) {
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
    twitch.say(`PopCorn ${senderName} hat "${video.title}" hinzugefügt! (${priority} Priorität)`)
  },
}