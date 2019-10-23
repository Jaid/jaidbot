import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle({senderName}) {
    const vlcState = await Video.getVlcState()
    if (!vlcState) {
      return
    }
    return `${senderName}, die aktuelle Lautstärke ist ${vlcState.volume} von 320.`
  },
}