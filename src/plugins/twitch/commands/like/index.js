import youtube from "lib/youtube"
import Video from "src/models/Video"
import ms from "ms.macro"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const video = await Video.getCurrentYoutubeVideo(ms`15 minutes`)
    if (!video) {
      return "Das dazugehörige YouTube-Video konnte nicht ermittelt werden."
    }
    await youtube.videos.rate({
      id: video.mediaId,
      rating: "like",
    })
    return `Like für dieses geile Video "${video.title}" ist raus!`
  },
}