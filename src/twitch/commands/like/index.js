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
      rating: "like",
    })
    return `Like für dieses geile Video "${videoInfo.fulltitle || videoInfo.title}" ist raus!`
  },
}