import twitch from "src/twitch"
import normalizeUsername from "lib/normalizeUsername"

const formatDate = momentDate => momentDate.format("DD.MM.YYYY [um] HH:mm")

export default {
  async handle({sender, senderName, positionalArguments}) {
    if (positionalArguments[0]) {
      const compareUserName = positionalArguments[0] |> normalizeUsername
      const [compareDisplayName, senderFollowMoment, compareFollowMoment] = await Promise.all([
        twitch.getNickname(compareUserName),
        twitch.getFollowMoment(sender.name),
        twitch.getFollowMoment(compareUserName),
      ])
      if (!senderFollowMoment && !compareFollowMoment) {
        return "Ihr seid beide keine Follower! Heiratet doch! DansGame"
      }
      if (!senderFollowMoment && compareFollowMoment) {
        return `${compareDisplayName} hat sich am ${compareFollowMoment |> formatDate} Uhr zum Follower transformiert. Das ist ein Akt der Persönlichkeitsentwicklung, der dir noch bevorsteht, ${senderName}.`
      }
      if (senderFollowMoment && !compareFollowMoment) {
        return `${senderName}, du hast dich am ${senderFollowMoment |> formatDate} Uhr zum Follower gemacht. Oh, und da hinten ist ${compareDisplayName}. Den kannst du ignorieren. Oder bekehren.`
      }
      if (senderFollowMoment.isBefore(compareFollowMoment.clone().subtract(7, "days"))) {
        return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen schon am ${senderFollowMoment |> formatDate}, ${senderName}. Knappes Höschen also!`
      }
      if (senderFollowMoment.isBefore(compareFollowMoment)) {
        return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen schon am ${senderFollowMoment |> formatDate}, ${senderName}, du frühes Vöglein!`
      }
      if (compareFollowMoment.isBefore(senderFollowMoment.clone().subtract(7, "days"))) {
        return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen erst am ${senderFollowMoment |> formatDate}, ${senderName}. Ist aber knapp, vielleicht holst du ja noch auf. Keepo`
      }
      return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen erst am ${senderFollowMoment |> formatDate}, ${senderName}!`
    } else {
      const followMoment = await twitch.getFollowMoment(sender.name)
      if (!followMoment) {
        return `${senderName}... NotLikeThis`
      }
      return `Für den Follow hast du dich ${followMoment.fromNow()} entschieden, ${senderName}, am ${followMoment |> formatDate} Uhr.`
    }
  },
}