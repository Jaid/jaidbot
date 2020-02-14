import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle() {
    const nextVideo = await Video.findNext()
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