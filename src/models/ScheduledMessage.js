import Sequelize, {Op} from "sequelize"
import twitch from "src/twitch"
import nodeSchedule from "node-schedule"

class ScheduledMessage extends Sequelize.Model {

  static async addForDate(date, message) {
    const scheduledMessage = await ScheduledMessage.create({
      date,
      message,
    })
    scheduledMessage.schedule()
  }

  static async addForDelay(ms, message) {
    await ScheduledMessage.addForDate(new Date(Date.now() + ms), message)
  }

  static async start() {
    const pendingMessages = await ScheduledMessage.getPendingMessages()
    for (const pendingMessage of pendingMessages) {
      pendingMessage.schedule()
    }
  }

  static async getPendingMessages() {
    return ScheduledMessage.findAll({
      where: {
        date: {
          [Op.gt]: Date.now(),
        },
      },
      attributes: ["id", "date", "message"],
    })
  }

  schedule() {
    nodeSchedule.scheduleJob(this.date, async () => {
      twitch.say(this.message)
      await this.update({isSent: true})
    })
  }

}

export const schema = {

  date: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  message: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  isSent: {
    allowNull: false,
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
}

export default ScheduledMessage