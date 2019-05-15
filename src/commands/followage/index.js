import moment from "moment"

export default {
  async handle({streamerClient, senderDisplayName, msg}) {
    const user = await streamerClient.helix.users.getUserById(msg.userInfo.userId)
    const followResult = await user.getFollowTo("65887522")
    if (followResult === null) {
      return `${senderDisplayName}... NotLikeThis`
    }
    const followMoment = moment(followResult.followDate).locale("de")
    return `Für den Follow hast du dich ${followMoment.fromNow()} entschieden, ${senderDisplayName}, am ${followMoment.format("DD.MM.YYYY [um] HH:mm")} Uhr.`
  },
}