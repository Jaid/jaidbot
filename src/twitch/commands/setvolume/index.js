import vlc from "lib/vlc"

export default {
  permission: "mod",
  needsDesktopClient: true,
  requiredArguments: 1,
  async handle({positionalArguments}) {
    const vlcState = await vlc.getState()
    if (!vlcState) {
      return
    }
    const currentVolume = vlcState.volume
    const chosenVolume = new positionalArguments[0]
    if (Number(chosenVolume) === currentVolume) {
      return `Die Lautstärke wurde von ${currentVolume}% auf ${currentVolume}... Moment. Am I a joke to you?`
    }
    await vlc.sendCommand("volume", {val: chosenVolume})
    const verb = chosenVolume > currentVolume ? "angehoben" : "gesenkt"
    return `Die Lautstärke wurde von ${currentVolume}% auf ${chosenVolume}% ${verb}.`
  },
}