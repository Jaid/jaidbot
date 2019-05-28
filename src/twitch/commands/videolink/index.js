import vlc from "lib/vlc"

export default {
  needsDesktopClient: true,
  async handle() {
    const result = await vlc.getCurrentVideo()
    if (!result) {
      return
    }
    const {videoInfo, vlcState} = result
    let url
    if (videoInfo.extractor === "youtube") {
      url = `https://youtu.be/${videoInfo.id}?t=${vlcState.time}`
    } else {
      url = videoInfo.webpage_url
    }
    return `PopCorn ${url}`
  },
}