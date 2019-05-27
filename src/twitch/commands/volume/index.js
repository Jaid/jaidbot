import vlc from "lib/vlc"

export default {
  needsDesktopClient: true,
  async handle({sender}) {
    const vlcState = await vlc.getState()
    if (!vlcState) {
      return
    }
    return `${sender.displayName}, die aktuelle Lautstärke ist ${vlcState.volume} von 320.`
  },
}