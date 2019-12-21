import apiServer from "src/plugins/apiServer"

import WhoisUser from "./WhoisUser"

export default {
  async handle({positionalArguments}) {
    const user = positionalArguments[0]
    const whoisUser = new WhoisUser
    await whoisUser.loadByUsername(user)
    if (!whoisUser.exists()) {
      return `Unter twitch.tv/${whoisUser.userInput} finde ich nichts.`
    }
    apiServer.emitToOverlay("whois", whoisUser.getData())
    return whoisUser.toString()
  },
}