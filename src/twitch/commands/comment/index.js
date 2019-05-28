import vlc from "lib/vlc"
import youtube from "lib/youtube"

export default {
  permission: "mod",
  minimumArguments: 1,
  needsDesktopClient: true,
  async handle({combinedArguments}) {
    const {videoInfo} = await vlc.getCurrentYoutubeVideo()
    if (!videoInfo) {
      return
    }
    await youtube.commentThreads.insert({
      part: "snippet",
      resource: {
        snippet: {
          videoId: videoInfo.id,
          topLevelComment: {
            snippet: {
              textOriginal: combinedArguments,
            },
          },
        },
      },
    })
    return `Comment unter dem Video "${videoInfo.fulltitle || videoInfo.title}" ist raus!`
  },
}