import {sample} from "lodash"
import twitch from "src/twitch"
import config from "lib/config"

const people = require("./people.txt").default.split("\n")

export default {
  permission: "mod",
  requiredArguments: 1,
  async handle({combinedArguments: newGame}) {
    const {game: currentGame} = await twitch.getMyStream()
    if (config.categoryShortcuts[newGame]) {
      newGame = config.categoryShortcuts[newGame]
    }
    if (newGame === currentGame) {
      return "Uff, da ändert sich nicht viel."
    }
    await twitch.setCategory(newGame)
    if (currentGame) {
      return `Die ${people |> sample}, die nur für ${currentGame} hier waren, sind jetzt herzlich ausgeladen, denn es geht weiter mit ${newGame}!`
    } else {
      return `Es geht weiter mit ${newGame}!`
    }
  },
}