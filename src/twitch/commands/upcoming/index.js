import Video from "src/models/Video"
import {Op} from "sequelize"

export default {
  needsDesktopClient: true,
  async handle({sender}) {
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
        ["createdAt", "asc"],
      ],
      attributes: [
        "publisher",
        "timestamp",
        "title",
        "videoFile",
      ],
    }
    if (Video.getCurrentVideo()) {
      query.offset = 1
    }
    const upcomingVideo = await Video.findOne(query)
    if (!upcomingVideo) {
      return "Es wurde kein weiteres Video gefunden."
    }
    return `Demnächst läuft hier ${upcomingVideo.title} von ${upcomingVideo.publisher}, ${sender.displayName}.`
  },
}