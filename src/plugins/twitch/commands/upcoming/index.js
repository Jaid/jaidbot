import {Op} from "sequelize"

import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle({senderName}) {
    const query = {
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
        ["id", "asc"],
      ],
      attributes: [
        "publisher",
        "title",
      ],
    }
    if (Video.getCurrentVideo()) {
      query.offset = 1
    }
    const upcomingVideo = await Video.findOne(query)
    if (!upcomingVideo) {
      return "Es wurde kein weiteres Video gefunden."
    }
    return `PopCorn ${senderName}, demnächst läuft hier "${upcomingVideo.title}" von ${upcomingVideo.publisher}.`
  },
}