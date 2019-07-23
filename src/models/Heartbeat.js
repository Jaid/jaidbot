import os from "os"

import Sequelize from "sequelize"
import measureTime from "measure-time"
import twitch from "src/twitch"
import ms from "ms.macro"

class Heartbeat extends Sequelize.Model {

  static currentStatus

  static start() {
    setInterval(Heartbeat.tick, ms`1 minute`)
  }

  static async currentStatus() {
    return Heartbeat.currentStatus
  }

  static async tick() {
    const getTime = measureTime()
    const values = {}
    const freeBytes = os.freemem()
    const totalBytes = os.totalmem()
    const usedByes = totalBytes - freeBytes
    const twitchStatus = await twitch.getMyStream()
    if (twitchStatus) {
      values.averageFps = twitchStatus.averageFPS
      values.delay = twitchStatus.delay
      values.viewers = twitchStatus.viewers
      values.game = twitchStatus.game
      values.videoHeight = twitchStatus.videoHeight
      values.streamType = twitchStatus.type
      values.streamStartedAt = twitchStatus.startDate
      values.language = twitchStatus.channel.broadcasterLanguage
      values.isMature = twitchStatus.channel.isMature
      values.followers = twitchStatus.channel.followers
      values.streamTitle = twitchStatus.channel.status
    }
    values.ramUsage = Math.floor(usedByes / totalBytes * 100)
    values.executionTime = getTime().milliseconds
    await Heartbeat.create(values)
    Heartbeat.currentStatus = values
  }

}

export const schema = {
  // Twitch
  averageFps: Sequelize.INTEGER,
  delay: Sequelize.INTEGER,
  game: Sequelize.STRING,
  videoHeight: Sequelize.INTEGER,
  streamType: Sequelize.STRING(16),
  streamStartedAt: Sequelize.DATE,
  isMature: Sequelize.BOOLEAN,
  followers: Sequelize.INTEGER,
  streamTitle: Sequelize.STRING,
  language: Sequelize.STRING,
  viewers: Sequelize.INTEGER,
  // System
  ramUsage: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
  executionTime: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
}

export default Heartbeat