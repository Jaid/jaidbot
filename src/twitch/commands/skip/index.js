import Video from "src/models/Video"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const video = await Video.getCurrentlyPlayed()
    if (!video) {
      return "Kein Video gefunden."
    }
    await video.update({
      skipped: true,
      watchedAt: new Date,
    })
    const result = await Video.sendVlcCommand("pl_stop")
    if (result) {
      return `Skippie! Weg mit "${video.title}"!`
    }
  },
}