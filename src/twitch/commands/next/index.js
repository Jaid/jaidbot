import {Op} from "sequelize"
import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle() {
    const nextVideo = await Video.findOne({
      where: {
        watchedAt: {
          [Op.eq]: null,
        },
        videoFile: {
          [Op.ne]: null,
        },
      },
      order: [
        ["priority", "desc"],
        ["createdAt", "asc"],
      ],
      attributes: [
        "publisher",
        "timestamp",
        "title",
        "videoFile",
      ],
    })
    if (!nextVideo) {
      return "Anscheinend ist die komplette Playlist leergeguckt. D:"
    }
    const result = await nextVideo.play()
    if (!result) {
      return "Oh, keine Ahnung."
    } else {
      return `PopCorn Jetzt kommt "${nextVideo.title}" von ${nextVideo.publisher}`
    }
  },
}