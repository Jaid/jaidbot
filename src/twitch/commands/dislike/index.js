import youtube from "lib/youtube"
import Video from "src/models/Video"
import ms from "ms.macro"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const video = await Video.getCurrentYoutubeVideo(ms`15 minutes`)
    if (!video) {
      return
    }
    await youtube.videos.rate({
      id: video.mediaId,
      rating: "dislike",
    })
    return `Dislike für dieses Kackvideo "${video.title}" ist raus!`
  },
}