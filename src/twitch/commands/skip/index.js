import Video from "src/models/Video"
import humanizeDuration from "humanize-duration"
import ms from "ms.macro"

const humanizeDurationShort = humanizeDuration.humanizer({
  language: "de",
  conjunction: " und ",
  serialComma: false,
  maxDecimalPoints: 0,
})

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const video = Video.getCurrentVideo()
    if (!video) {
      return "Kein Video gefunden."
    }
    await video.update({
      skipped: true,
      watchedAt: new Date,
    })
    const result = await Video.sendVlcCommand("pl_stop")
    if (!result) {
      return
    }
    const durationMs = video.getDurationMs()
    const currentTime = video.timestamp
    if (currentTime / durationMs > 0.5) {
      return `Skippie! Weg mit "${video.title}"!`
    }
    const skippedMs = Math.max(ms`2 seconds`, durationMs - currentTime)
    return `Alles klar, dann schau dir halt nicht die letzten ${humanizeDurationShort(skippedMs)} von "${video.title}" an.`
  },
}