import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle() {
    const video = await Video.getCurrentVideo()
    if (!video) {
      return
    }
    let url
    if (video.extractor === "youtube") {
      const timestampSeconds = Math.floor(video.timestamp / 1000)
      url = `https://youtu.be/${video.mediaId}?t=${timestampSeconds}`
    } else {
      url = video.webUrl
    }
    return `PopCorn ${url}`
  },
}