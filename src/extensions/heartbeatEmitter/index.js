import os from "os"

import ms from "ms.macro"
import measureTime from "measure-time"
import Heartbeat from "src/models/Heartbeat"
import twitch from "src/twitch"

class HeartbeatEmitter {

  async init() {
    setTimeout(() => {
      this.update()
    }, ms`5 seconds`)
  }

  async update() {
    const getTime = measureTime()
    const values = {}
    const freeBytes = os.freemem()
    const totalBytes = os.totalmem()
    const usedByes = totalBytes - freeBytes
    const twitchStatus = await twitch.getMyStream()
    values.averageFps = twitchStatus.averageFPS
    values.delay = twitchStatus.delay
    values.game = twitchStatus.game
    values.videoHeight = twitchStatus.videoHeight
    values.streamType = twitchStatus.type
    values.streamStartDate = twitchStatus.channel.creationDate
    values.language = twitchStatus.channel.broadcasterLanguage
    values.isMature = twitchStatus.channel.isMature
    values.followers = twitchStatus.channel.followers
    values.streamTitle = twitchStatus.channel.status
    values.ramUsage = usedByes / totalBytes
    values.executionTime = getTime().milliseconds
    await Heartbeat.create(values)
    this.currentStatus = values
  }

}

export default new HeartbeatEmitter