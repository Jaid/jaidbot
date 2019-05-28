import vlc from "lib/vlc"

export default {
  permission: "mod",
  needsDesktopClient: true,
  async handle() {
    const result = await vlc.sendCommand("pl_next")
    if (result) {
      return "Skippie!"
    }
  },
}