import twitch from "src/twitch"
import normalizeUsername from "lib/normalizeUsername"

export default {
  async handle({positionalArguments}) {
    const user = positionalArguments[0]
    const info = await twitch.streamerClient.helix.users.getUserByName(normalizeUsername(user))
    debugger
    return "abc"
  },
}