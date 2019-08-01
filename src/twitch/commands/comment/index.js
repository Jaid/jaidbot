import youtube from "lib/youtube"
import Video from "src/models/Video"
import ms from "ms.macro"

export default {
  permission: "mod",
  minimumArguments: 1,
  needsDesktopClient: true,
  async handle({combinedArguments}) {
    const video = await Video.getCurrentYoutubeVideo(ms`15 minutes`)
    if (!video) {
      return "Das dazugehörige YouTube-Video konnte nicht ermittelt werden."
    }
    await youtube.commentThreads.insert({
      part: "snippet",
      resource: {
        snippet: {
          videoId: video.mediaId,
          topLevelComment: {
            snippet: {
              textOriginal: combinedArguments,
            },
          },
        },
      },
    })
    return `Comment unter dem Video "${video.title}" ist raus!`
  },
}