import twitch from "src/twitch"

const formatDate = momentDate => momentDate.format("DD.MM.YYYY [um] HH:mm")

export default {
  async handle({sender, positionalArguments}) {
    if (positionalArguments[0]) {
      const compareUserName = positionalArguments[0]
      const [compareDisplayName, senderFollowMoment, compareFollowMoment] = await Promise.all([
        twitch.userNameToDisplayName(compareUserName),
        twitch.getFollowMoment(sender.name),
        twitch.getFollowMoment(compareUserName),
      ])
      if (!senderFollowMoment && !compareFollowMoment) {
        return "Ihr seid beide keine Follower! Heiratet doch! DansGame"
      }
      if (!senderFollowMoment && compareFollowMoment) {
        return `${compareDisplayName} hat sich am ${compareFollowMoment |> formatDate} Uhr zum Follower transformiert. Das ist ein Akt der Persönlichkeitsentwicklung, der dir noch bevorsteht, ${sender.displayName}.`
      }
      if (senderFollowMoment && !compareFollowMoment) {
        return `${sender.displayName}, du hast dich am ${senderFollowMoment |> formatDate} Uhr zum Follower gemacht. Oh, und da hinten ist ${compareDisplayName}. Den kannst du ignorieren. Oder bekehren.`
      }
      if (senderFollowMoment.isBefore(compareFollowMoment.clone().subtract(7, "days"))) {
        return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen schon am ${senderFollowMoment |> formatDate}, ${sender.displayName}. Knappes Höschen also!`
      }
      if (senderFollowMoment.isBefore(compareFollowMoment)) {
        return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen schon am ${senderFollowMoment |> formatDate}, ${sender.displayName}, du frühes Vöglein!`
      }
      if (compareFollowMoment.isBefore(senderFollowMoment.clone().subtract(7, "days"))) {
        return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen erst am ${senderFollowMoment |> formatDate}, ${sender.displayName}. Ist aber knapp, vielleicht holst du ja noch auf. Keepo`
      }
      return `Am ${compareFollowMoment |> formatDate} ist ${compareDisplayName} Follower geworden, du hingegen erst am ${senderFollowMoment |> formatDate}, ${sender.displayName}!`
    } else {
      const followMoment = await twitch.getFollowMoment(sender.name)
      if (!followMoment) {
        return `${sender.displayName}... NotLikeThis`
      }
      return `Für den Follow hast du dich ${followMoment.fromNow()} entschieden, ${sender.displayName}, am ${followMoment |> formatDate} Uhr.`
    }
  },
}