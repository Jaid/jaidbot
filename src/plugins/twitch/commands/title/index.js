import main from "src/plugins/main"
import twitch from "src/plugins/twitch"

export default {
  permission: "mod",
  async handle({combinedArguments: newTitle}) {
    main.clearProject()
    await twitch.setTitle(newTitle)
    // await afkManager.updateTitle()
    return `Dieser Stream wurde umgetauft zu "${newTitle}". Amen.`
  },
}