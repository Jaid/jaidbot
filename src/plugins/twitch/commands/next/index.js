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
        frozenUntil: {
          [Op.lt]: Date.now(),
        },
      },
      order: [
        ["priority", "desc"],
        ["id", "asc"],
      ],
    })
    if (!nextVideo) {
      return "Anscheinend ist die komplette Playlist leergeguckt. D:"
    }
    Video.setCurrentVideo(nextVideo)
    const result = await nextVideo.play()
    if (!result) {
      return "Oh, keine Ahnung."
    } else {
      return `PopCorn Jetzt kommt "${nextVideo.title}" von ${nextVideo.publisher}`
    }
  },
}