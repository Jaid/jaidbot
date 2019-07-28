import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle({sender}) {
    const vlcState = await Video.getVlcState()
    if (!vlcState) {
      return
    }
    return `${sender.displayName}, die aktuelle Lautstärke ist ${vlcState.volume} von 320.`
  },
}