import vlc from "lib/vlc"
import youtube from "lib/youtube"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const {videoInfo} = await vlc.getCurrentYoutubeVideo()
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