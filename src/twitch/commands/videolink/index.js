import vlc from "lib/vlc"

export default {
  needsDesktopClient: true,
  async handle() {
    const {videoInfo, vlcState} = await vlc.getCurrentVideo()
    let url
    if (videoInfo.extractor === "youtube") {
      url = `https://youtu.be/${videoInfo.id}?t=${vlcState.time}`
    } else {
      url = videoInfo.webpage_url
    }
    return `PopCorn ${url}`
  },
}