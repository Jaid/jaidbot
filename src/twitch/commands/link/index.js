import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle({senderName}) {
    const video = Video.getCurrentVideo()
    if (!video) {
      return `Es gibt gerade kein abgespieltes Video, ${senderName}.`
    }
    let url
    if (video.extractor === "youtube") {
      let query = ""
      if (video.timestamp > 0 && !video.hasBeenWatched()) {
        const timestampSeconds = Math.floor(video.timestamp / 1000)
        query = `?t=${timestampSeconds}`
      }
      url = `https://youtu.be/${video.mediaId}${query}`
    } else {
      url = video.webUrl
    }
    return `PopCorn ${url}`
  },
}