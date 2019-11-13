import emitPromise from "emit-promise"
import apiServer from "src/plugins/apiServer"

export default {
  needsDesktopClient: true,
  requiredArguments: 1,
  async handle({senderName, combinedArguments: sourceName}) {
    const affectedScenes = await emitPromise.withDefaultTimeout(apiServer.client, "showObsSource", sourceName)
    if (affectedScenes) {
      return "Oh, da ist die Quelle ja wieder! PogChamp"
    } else {
      return `Da hat sich nicht viel getan, sprach der Hahn zu ${senderName}.`
    }
  },
}