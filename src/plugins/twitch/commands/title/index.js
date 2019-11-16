import afkManager from "src/plugins/twitch/afkManager"
import main from "src/plugins/main"

export default {
  permission: "mod",
  async handle({combinedArguments: newTitle}) {
    main.clearProject()
    await afkManager.updateTitle(newTitle)
    return `Dieser Stream wurde umgetauft zu "${newTitle}". Amen.`
  },
}