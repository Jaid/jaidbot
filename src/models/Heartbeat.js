import os from "os"

import Sequelize from "sequelize"
import measureTime from "measure-time"
import Heartbeat from "src/models/Heartbeat"
import twitch from "src/twitch"

class HeartBeat extends Sequelize.Model {

  static currentStatus

  static async currentStatus() {
    return HeartBeat.currentStatus
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
      values.streamStartDate = twitchStatus.startDate
      values.language = twitchStatus.channel.broadcasterLanguage
      values.isMature = twitchStatus.channel.isMature
      values.followers = twitchStatus.channel.followers
      values.streamTitle = twitchStatus.channel.status
    }
    values.ramUsage = usedByes / totalBytes
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
  streamStartDate: Sequelize.DATE,
  isMature: Sequelize.BOOLEAN,
  followers: Sequelize.INTEGER,
  streamTitle: Sequelize.STRING,
  language: Sequelize.STRING,
  viewers: Sequelize.INTEGER,
  // System
  ramUsage: {
    allowNull: false,
    type: Sequelize.FLOAT,
  },
  executionTime: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
}

export default HeartBeat