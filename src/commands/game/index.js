import {sample} from "lodash"

const people = require("./people.txt").default.split("\n")
const shortcuts = require("./shortcuts.yml")

export default {
  requiredArguments: 1,
  async handle({streamerClient, commandArguments}) {
    const {game: currentGame} = await streamerClient.kraken.streams.getStreamByChannel("65887522")
    let newGame = commandArguments._[0]
    if (shortcuts[newGame]) {
      newGame = shortcuts[newGame]
    }
    if (newGame === currentGame) {
      return "Uff, da ändert sich nicht viel."
    }
    await streamerClient.kraken.channels.updateChannel("65887522", {game: newGame})
    if (currentGame) {
      return `Die ${people |> sample}, die nur für ${currentGame} hier waren, sind jetzt herzlich ausgeladen, denn es geht weiter mit ${newGame}!`
    } else {
      return `Es geht weiter mit ${newGame}!`
    }
  },
}