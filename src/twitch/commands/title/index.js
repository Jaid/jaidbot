import afkManager from "src/twitch/afkManager"

export default {
  permission: "mod",
  async handle({combinedArguments: newTitle}) {
    await afkManager.setTitle(newTitle)
    return `Dieser Stream wurde umgetauft zu "${newTitle}". Amen.`
  },
}