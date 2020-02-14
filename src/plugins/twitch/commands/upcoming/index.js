import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle({senderName}) {
    const query = {
      attributes: [
        "publisher",
        "title",
      ],
    }
    if (Video.getCurrentVideo()) {
      query.offset = 1
    }
    const upcomingVideo = await Video.findNext(query)
    if (!upcomingVideo) {
      return "Es wurde kein weiteres Video gefunden."
    }
    return `PopCorn ${senderName}, demnächst läuft hier "${upcomingVideo.title}" von ${upcomingVideo.publisher}.`
  },
}