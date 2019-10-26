import Video from "src/models/Video"
import ms from "ms.macro"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const video = Video.getCurrentVideo()
    if (!video) {
      return "Kein Video gefunden."
    }
    await video.update({
      frozenUntil: Date.now() + ms`24 hours`,
    })
    const result = await Video.sendVlcCommand("pl_stop")
    if (!result) {
      return
    }
    return `"${video.title}" wird sich in den nächsten 24 Stunden hoffentlich nicht mehr blicken lassen.`
  },
}