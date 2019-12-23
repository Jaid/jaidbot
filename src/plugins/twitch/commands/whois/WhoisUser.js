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

export default class WhoisUser {

  /**
   * @type {import("twitch").HelixUser}
   */
   helixProfile = null

   /**
    * @type {import("twitch").User}
    */
   krakenProfile = null

   /**
    * @type {number}
    */
   id = null

   /**
    * @type {import("twitch").HelixStream}
    */
   stream = null

   /**
    * @type {import("twitch").HelixStream}
    */
   stream = null

   /**
    * @type {import("twitch").HelixGame}
    */
  game = null

  /**
    * @type {import("twitch").HelixPaginatedResultWithTotal<import("twitch").HelixFollow>}
    */
  followers = null

  /**
    * @type {import("twitch").HelixPaginatedResultWithTotal<import("twitch").HelixFollow>}
    */
  followees = null

  /**
   * @type {import("twitch").HelixFollow}
   */
  streamerFollow = null

  /**
   * @type {import("twitch").HelixPaginatedResult<import("twitch").HelixVideo>}
   */
  video = null

  /**
   * @type {string}
   */
  userInput = null

  /**
   * @type {string}
   */
  displayName = null

  /**
    * @return {boolean}
    */
  exists() {
    return Boolean(this.id)
  }

  getStreamType() {
    return this.stream?.type || "null"
  }

  isLive() {
    return this.getStreamType() === "live"
  }

  hasVideos() {
    return hasContent(this.videos?.data)
  }

  async loadByUsername(user) {
    this.userInput = normalizeUsername(user)
    this.helixProfile = await twitch.streamerClient.helix.users.getUserByName(this.userInput)
    if (!this.helixProfile) {
      return
    }
    this.id = this.helixProfile.id
    this.displayName = this.helixProfile.displayName || this.helixProfile.name
    this.krakenProfile = await twitch.streamerClient.kraken.users.getUser(this.id)
    this.stream = await this.helixProfile.getStream()
    this.followers = await twitch.streamerClient.helix.users.getFollows({followedUser: this.id})
    this.followees = await twitch.streamerClient.helix.users.getFollows({user: this.id})
    this.streamerFollow = await this.helixProfile.getFollowTo(twitch.streamerUser.twitchId)
    this.videos = await twitch.streamerClient.helix.videos.getVideosByUser(this.id, {
      type: "archive",
      orderBy: "time",
      limit: 1,
    })
    if (this.isLive()) {
      this.game = await this.stream.getGame()
    }
  }

  /**
   * @return {Object}
   */
  getData() {
    const data = {
      displayName: this.displayName,
      avatarUrl: this.helixProfile.profilePictureUrl,
      offlineImageUrl: this.helixProfile.offlinePlaceholderUrl,
      creationDate: Number(this.krakenProfile.creationDate),
      followers: this.followers.total,
      followees: this.followees.total,
      twitchId: this.id,
      views: this.helixProfile.views,
    }
    data.creationDateString = moment(data.creationDate).fromNow()
    if (this.streamerFollow) {
      data.followDate = Number(this.streamerFollow.followDate)
    }
    if (this.isLive()) {
      data.stream = {
        game: this.game.name,
        startDate: Number(this.stream.startDate),
        startDateString: `seit ${hoursMinutesHumanize(Date.now() - Number(this.stream.startDate))}`,
        viewers: this.stream.viewers,
        languageId: this.stream?.language,
      }
      if (data.stream.languageId) {
        data.stream.languageTitle = prettifyLanguage(data.stream.languageId)
      }
    }
    return data
  }

  /**
   * @return {string}
   */
  toString() {
    const details = []
    if (this.followers.total > 0) {
      let detail = `hat ${millify(this.followers.total)} Follower`
      if (this.followers.total <= 5) {
        const followerNames = this.followers.data.map(follower => follower.userDisplayName || follower.userId)
        detail += ` (${followerNames.join(", ")})`
      }
      details.push(detail)
    }
    if (this.isLive()) {
      details.push(`streamt ${this.game.name} seit ${hoursMinutesHumanize(Date.now() - Number(this.stream.startDate))} auf ${prettifyLanguage(this.stream?.language)} für ${millify(this.stream.viewers)} Zuschauer`)
    } else if (this.hasVideos()) {
      const video = this.videos.data[0]
      details.push(`hat ${moment(video.publishDate).fromNow()} auf ${prettifyLanguage(video?.language)} gestreamt (und zwar ${hoursMinutesHumanize(video.durationInSeconds * 1000)} lang)`)
    }
    if (this.streamerFollow) {
      const streamerFollowMoment = moment(this.streamerFollow.followDate)
      let detail = `folgte Jaid ${moment(streamerFollowMoment).fromNow()}`
      if (this.followees.total - 1) {
        detail += ` und sonst noch ${this.followees.total - 1} anderen`
      }
      details.push(detail)
    } else if (this.followees.total) {
      details.push(`folgt ${zahl(this.followees.total, "Channel")}`)
    }
    const detailsString = hasContent(details) ? `, ${details.join(", ")}` : ""
    const whoisMessage = `${this.displayName} hat sich ${moment(this.krakenProfile.creationDate).fromNow()} erstellt${detailsString}.`
    return whoisMessage
  }

}