import Video from "src/models/Video"

export default {
  permission: "mod",
  needsDesktopClient: true,
  requiredArguments: 1,
  async handle({positionalArguments}) {
    const vlcState = await Video.getVlcState()
    if (!vlcState) {
      return
    }
    const currentVolume = vlcState.volume
    const chosenVolume = Number(positionalArguments[0])
    if (chosenVolume === currentVolume) {
      return `Die Lautstärke wurde von ${currentVolume}% auf ${currentVolume}... Moment. Am I a joke to you?`
    }
    await Video.sendVlcCommand("volume", {val: chosenVolume})
    const verb = chosenVolume > currentVolume ? "angehoben" : "gesenkt"
    return `Die Lautstärke wurde von ${currentVolume} auf ${chosenVolume} von maximal 320 ${verb}.`
  },
}