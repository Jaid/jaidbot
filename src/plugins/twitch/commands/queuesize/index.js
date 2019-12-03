import {Op} from "sequelize"

import {hoursMinutesHumanize} from "lib/humanizeDuration"

import Video from "src/models/Video"

export default {
  async handle() {
    const data = await Video.findAll({
      where: {
        watchedAt: {
          [Op.eq]: null,
        },
      },
      raw: true,
      attributes: [
        "timestamp",
        "duration",
        "vlcDuration",
      ],
    })
    const durationSum = data.reduce((sum, current) => {
      const duration = current.vlcDuration || current.duration
      const timestamp = current.timestamp || 0
      const actualDuration = duration - timestamp
      return sum + actualDuration
    }, 0)
    return `Es sind ${data.length} ungesehene Videos in der Liste. Es dauert noch ${durationSum |> hoursMinutesHumanize}, diesen Haufen durchzuschauen.`
  },
}