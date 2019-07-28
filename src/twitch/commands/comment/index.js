import youtube from "lib/youtube"
import Video from "src/models/Video"
import ms from "ms.macro"

export default {
  permission: "mod",
  minimumArguments: 1,
  async handle({combinedArguments}) {
    const {videoInfo} = await Video.getCurrentYoutubeVideo(ms`15 minutes`)
    if (!videoInfo) {
      return "Das dazugehörige YouTube-Video konnte nicht ermittelt werden."
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