import youtube from "lib/youtube"
import Video from "src/models/Video"
import ms from "ms.macro"

export default {
  permission: "mod",
  async handle() {
    const {videoInfo} = await Video.getCurrentYoutubeVideo(ms`15 minutes`)
    if (!videoInfo) {
      return
    }
    await youtube.videos.rate({
      id: videoInfo.id,
      rating: "dislike",
    })
    return `Dislike für dieses Kackvideo "${videoInfo.fulltitle || videoInfo.title}" ist raus!`
  },
}