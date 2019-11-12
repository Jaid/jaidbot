import os from "os"

import Sequelize from "sequelize"
import measureTime from "measure-time"
import twitch from "src/plugins/twitch"
import ms from "ms.macro"

class Heartbeat extends Sequelize.Model {

  static currentStatus

  static lastTwitchStatus

  static start() {
    if (!twitch.ready) {
      return
    }
    setInterval(Heartbeat.tick, ms`1 minute`)
  }

  static async tick() {
    const getTime = measureTime()
    const values = {}
    const freeBytes = os.freemem()
    const totalBytes = os.totalmem()
    const usedByes = totalBytes - freeBytes
    const twitchStatus = await twitch.getMyStream()
    if (twitchStatus) {
      Heartbeat.lastTwitchStatus = {
        averageFps: twitchStatus.averageFPS,
        delay: twitchStatus.delay,
        viewers: twitchStatus.viewers,
        game: twitchStatus.game,
        videoHeight: twitchStatus.videoHeight,
        streamType: twitchStatus.type,
        streamStartedAt: twitchStatus.startDate,
        language: twitchStatus.channel.broadcasterLanguage,
        isMature: twitchStatus.channel.isMature,
        followers: twitchStatus.channel.followers,
        streamTitle: twitchStatus.channel.status,
      }
      Object.assign(values, Heartbeat.lastTwitchStatus)
    }
    values.ramUsage = Math.floor(usedByes / totalBytes * 100)
    values.executionTime = getTime().milliseconds
    await Heartbeat.create(values)
    Heartbeat.currentStatus = values
  }

}

export const schema = {
  // Twitch
  averageFps: Sequelize.SMALLINT,
  delay: Sequelize.SMALLINT,
  game: Sequelize.STRING,
  videoHeight: Sequelize.SMALLINT,
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
    type: Sequelize.SMALLINT,
  },
  executionTime: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
}

export default Heartbeat