import hasContent from "has-content"
import zahl from "zahl"

import {hoursMinutesHumanize} from "lib/humanizeDuration"
import millify from "lib/millify"
import moment from "lib/moment"
import normalizeUsername from "lib/normalizeUsername"

import twitch from "src/plugins/twitch"

function prettifyLanguage(code) {
  return {
    de: "Deutsch",
    en: "Englisch",
    id: "Indonesisch",
    es: "Spanisch",
    fr: "Französisch",
    it: "Italienisch",
    nl: "Niederländisch",
    pl: "Polnisch",
    pt: "Portugisisch",
    tr: "Türkisch",
    ru: "Russisch",
    ja: "Japanisch",
    ko: "Koreanisch",
  }[code] || code
}

export default {
  async handle({positionalArguments}) {
    const user = positionalArguments[0]
    const normalizedUser = normalizeUsername(user)
    const profile = await twitch.streamerClient.helix.users.getUserByName(normalizedUser)
    if (!profile) {
      return `Unter twitch.tv/${normalizedUser} finde ich nichts.`
    }
    const oldApiProfile = await twitch.streamerClient.kraken.users.getUser(profile.id)
    const stream = await profile.getStream()
    const followers = await twitch.streamerClient.helix.users.getFollows({followedUser: profile.id})
    const followees = await twitch.streamerClient.helix.users.getFollows({user: profile.id})
    const streamerFollow = await profile.getFollowTo(twitch.streamerUser.twitchId)
    const videos = await twitch.streamerClient.helix.videos.getVideosByUser(profile.id, {
      type: "archive",
      orderBy: "time",
      limit: 1,
    })
    const details = []
    if (followers.total > 0) {
      let detail = `hat ${millify(followers.total)} Follower`
      if (followers.total <= 5) {
        const followerNames = followers.data.map(follower => follower.userDisplayName || follower.userId)
        detail += ` (${followerNames.join(", ")})`
      }
      details.push(detail)
    }
    if (stream?.type === "live") {
      const game = await stream.getGame()
      details.push(`streamt ${game.name} seit ${hoursMinutesHumanize(Date.now() - Number(stream.startDate))} auf ${prettifyLanguage(stream?.language)} für ${millify(stream.viewers)} Zuschauer`)
    } else if (videos?.data?.[0]) {
      const video = videos.data[0]
      details.push(`hat ${moment(video.publishDate).fromNow()} auf ${prettifyLanguage(video?.language)} gestreamt (und zwar ${hoursMinutesHumanize(video.durationInSeconds * 1000)} lang)`)
    }
    if (streamerFollow) {
      const streamerFollowMoment = moment(streamerFollow.followDate)
      let detail = `folgte Jaid ${moment(streamerFollowMoment).fromNow()}`
      if (followees.total - 1) {
        detail += ` und sonst noch ${followees.total - 1} anderen`
      }
      details.push(detail)
    } else if (followees.total) {
      details.push(`folgt ${zahl(followees.total, "Channel")}`)
    }
    const detailsString = hasContent(details) ? `, ${details.join(", ")}` : ""
    return `${profile.displayName} hat sich ${moment(oldApiProfile.creationDate).fromNow()} erstellt${detailsString}.`
  },
}