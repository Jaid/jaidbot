import emitPromise from "emit-promise"
import execa from "execa"
import {isString, pick} from "lodash"
import ms from "ms.macro"
import Sequelize, {Op} from "sequelize"

import moment from "lib/moment"

import core, {config, logger} from "src/core"
import TwitchUser from "src/models/TwitchUser"
import apiServer from "src/plugins/apiServer"
import twitch from "src/plugins/twitch"

/**
 * @typedef {Object} YoutubeDlInfo
 * @prop {number} abr Audio Bitrate
 * @prop {string} acodec Audio Codec
 * @prop {number} age_limit
 * @prop {string} alt_title
 * @prop {string} artist
 * @prop {number} average_rating
 * @prop {string[]} categories
 * @prop {string} channel_id
 * @prop {string} channel_url
 * @prop {string} creator
 * @prop {string} description
 * @prop {number} dislike_count
 * @prop {string} display_id
 * @prop {number} duration Duration in seconds
 * @prop {string} ext Guessed file extension
 * @prop {string} extractor Extractor engine ID
 * @prop {string} extractor_key Extractor engine title
 * @prop {string} format
 * @prop {string} format_id
 * @prop {number} fps
 * @prop {number} height
 * @prop {string} id
 * @prop {boolean|null} is_live
 * @prop {number} like_count
 * @prop {string} release_date
 * @prop {number} release_year
 * @prop {string[]} tags
 * @prop {string} thumbnail
 * @prop {string} title
 * @prop {string} upload_date
 * @prop {string} uploader
 * @prop {string} uploader_id
 * @prop {string} uploader_url
 * @prop {number} vbr
 * @prop {string} vcodec
 * @prop {number} view_count
 * @prop {string} webpage_url
 * @prop {string} webpage_url_basename
 * @prop {number} width
 */

/**
 * @typedef {Object} QueueOptions
 * @prop {number} priority
 * @prop {string} requesterTwitchId
 * @prop {string} requestUrl
 */

/**
 * @typedef {Object} VlcState
 * @prop {number} durationMs
 * @prop {string} file
 * @prop {number} position
 * @prop {string} state
 * @prop {number} timestampMs
 */

class Video extends Sequelize.Model {

  /**
   * @type {Video}
   */
  static currentVideo = null

  /**
   * @type {number}
   */
  static currentVideoHeartbeatTimestamp = null

  static associate(models) {
    Video.belongsTo(models.TwitchUser, {
      as: "Requester",
      foreignKey: "RequesterId",
    })
  }

  static start() {
    apiServer.on("gotClient", client => {
      logger.debug("Received gotClient in Video model handler")
      client.on("videoDownloaded", Video.handleVideoDownloaded)
      client.on("vlcState", Video.handleVlcState)
      client.on("setInfoFile", Video.handleSetInfoFile)
      client.on("getDownloadJobs", callback => Video.handleGetDownloadJobs(callback))
    })
  }

  /**
   * @param {import()} queryOptions
   * @return {Promise<Video>}
   */
  static async findNext(queryOptions) {
    return Video.findOne({
      where: {
        watchedAt: {
          [Op.eq]: null,
        },
        videoFile: {
          [Op.ne]: null,
        },
        frozenUntil: {
          [Op.lt]: Date.now(),
        },
      },
      order: [
        ["timestamp", "desc nulls last"],
        ["priority", "desc"],
        ["publisher", "asc"],
        ["id", "desc"],
      ],
      ...queryOptions,
    })
  }

  /**
   * @param {Video} video
   */
  static setCurrentVideo(video) {
    Video.currentVideoHeartbeatTimestamp = Date.now()
    Video.currentVideo = video
  }

  static async handleVideoDownloaded({videoId, bytes, videoFile, infoFile}) {
    try {
      await Video.update({
        bytes,
        videoFile,
        infoFile,
        downloadedAt: new Date,
      }, {
        where: {
          id: videoId,
        },
      })
    } catch (error) {
      logger.error("Error at videoDownloaded handler: %s", error)
    }
  }

  /**
   * @param {VlcState} state
   */
  static async handleVlcState(state) {
    try {
      Video.currentVideoHeartbeatTimestamp = Date.now()
      const isNewVideo = Video.currentVideo?.videoFile !== state.file
      if (!isNewVideo && Video.currentVideo.hasBeenWatched()) {
        return
      }
      await core.database.transaction(async transaction => {
        if (isNewVideo) {
          const video = await Video.findOne({
            transaction,
            where: {
              videoFile: state.file,
            },
          })
          if (!video) {
            if (Video.currentVideo) {
              logger.info("Video.currentVideo will be set to null, because current video is not found in database")
              Video.currentVideo = null
            }
            return
          }
          logger.info(`Current video set to #${video.id}`)
          Video.currentVideo = video
          if (video.hasBeenWatched()) {
            logger.debug("Not applying any changes on video, because it has already been watched")
            return
          }
        }
        const video = Video.currentVideo
        const saveFields = ["timestamp"]
        if (!video.vlcDuration) {
          video.vlcDuration = state.durationMs
          saveFields.push("vlcDuration")
        }
        video.timestamp = state.timestampMs
        const remainingTime = state.durationMs - state.timestampMs
        if (remainingTime < ms`10 seconds`) {
          video.watchedAt = moment().add(remainingTime, "ms").toDate()
          saveFields.push("watchedAt")
          logger.debug("Video #%s will be marked as watched", video.id)
        }
        await video.save({
          transaction,
          fields: saveFields,
        })
      })
    } catch (error) {
      logger.error("Error at vlcState handler: %s", error)
    }
  }

  static async handleSetInfoFile({videoId, infoFile}) {
    try {
      await Video.update({infoFile}, {
        where: {
          id: videoId,
        },
      })
      logger.debug("Got info file path for video #%s", videoId)
    } catch (error) {
      logger.error("Error at setInfoFile handler: %s", error)
    }
  }

  /**
   * @param {Function} callback
   */
  static async handleGetDownloadJobs(callback) {
    try {
      const videosToDownload = await Video.findAll({
        where: {
          videoFile: {
            [Op.eq]: null,
          },
        },
        raw: true,
        attributes: ["id", "downloadFormat", "info"],
      })
      callback(videosToDownload)
      return
    } catch (error) {
      logger.error("Error at getDownloadJobs handler: %s", error)
      callback(false)
      return
    }
  }

  /**
   * @async
   * @function
   * @param {string} url
   * @param {QueueOptions} [options]
   * @return {Promise<Video>}
   */
  static async queueByUrl(url, options) {
    let execResult
    let videoInfo
    try {
      execResult = await execa(config.youtubeDlPath, [
        "--no-color",
        "--ignore-config",
        "--abort-on-error",
        "--netrc",
        "--format",
        config.youtubeDlFormat,
        "--cookies",
        config.youtubeDlCookieFile,
        "--dump-single-json",
        url,
      ])
      videoInfo = execResult.stdout |> JSON.parse
    } catch (error) {
      logger.error("Could not use youtube-dl to fetch media information of url %s: %s\ncommand: %s\nstd: %s", url, error, execResult?.command || error?.command, execResult?.all || error?.all)
    }
    if (!videoInfo && apiServer.hasClient()) {
      logger.warn("Could not fetch info for %s, trying on Desktop instead", url)
      videoInfo = await emitPromise.withDefaultTimeout(apiServer.client, "fetchVideoInfo", url)
    }
    if (videoInfo) {
      return Video.queueByInfo(videoInfo, {
        requestUrl: url,
        ...options,
      })
    } else {
      throw new Error(`Could not fetch info for video URL ${url}`)
    }
  }

  /**
   * @async
   * @function
   * @param {YoutubeDlInfo} videoInfo
   * @param {QueueOptions} [options]
   * @return {Promise<Video>}
   */
  static async queueByInfo(videoInfo, options) {
    const publishDateString = videoInfo.release_date || videoInfo.upload_date
    let publishDate
    if (publishDateString |> isString) {
      publishDate = moment(publishDateString, "YYYYMMDD").toDate()
    }
    const videoValues = {
      title: videoInfo.title || videoInfo.webpage_url,
      duration: videoInfo.duration * 1000,
      views: videoInfo.view_count,
      likes: videoInfo.like_count,
      dislikes: videoInfo.dislike_count,
      publishedAt: publishDate,
      format: videoInfo.format,
      extractor: videoInfo.extractor || videoInfo.extractor_key,
      width: videoInfo.width,
      height: videoInfo.height,
      webUrl: videoInfo.webpage_url || videoInfo.channel_url || videoInfo.uploader_url,
      audioCodec: videoInfo.acodec,
      videoCodec: videoInfo.vcodec,
      formatId: videoInfo.format_id,
      fileExtension: videoInfo.ext,
      description: videoInfo.description,
      thumbnailUrl: videoInfo.thumbnail,
      channelUrl: videoInfo.channel_url || videoInfo.uploader_url,
      audioBitrate: videoInfo.abr,
      videoBitrate: videoInfo.vbr,
      mediaId: videoInfo.id,
      ageLimit: videoInfo.age_limit,
      publisher: videoInfo.uploader || videoInfo.uploader_id,
      publisherId: videoInfo.uploader_id,
      info: videoInfo,
      downloadFormat: config.youtubeDlFormat,
    }
    if (options.priority !== undefined) {
      videoValues.priority = options.priority
    }
    if (options.requesterTwitchId) {
      const twitchUser = await TwitchUser.getByTwitchId(options.requesterTwitchId)
      videoValues.RequesterId = twitchUser.id
    }
    if (options.requestUrl) {
      videoValues.requestUrl = options.requestUrl
    }
    const [video, isNew] = await Video.findOrCreate({
      where: {
        extractor: videoValues.extractor,
        mediaId: videoValues.mediaId,
      },
      defaults: videoValues,
    })
    if (!isNew) {
      await video.update({
        ...videoValues,
        priority: video.priority + 10,
      })
      logger.info("Video #%s \"%s\" got requested again, increased priority from %s to %s", video.id, video.title, video.priority - 10, video.priority)
    } else {
      logger.info("Requested video #%s \"%s\" with priority %s", video.id, video.title, video.priority)
      if (apiServer.hasClient()) {
        apiServer.client.emit("queueInfo", {
          videoInfo,
          videoId: video.id,
          downloadFormat: video.downloadFormat,
        })
      }
    }
    return video
  }

  /**
   * @param {number} [maxAge=10000] Maximum milliseconds passed since the client reported a video as being watched the last time
   */
  static getCurrentVideo(maxAge = ms`10 seconds`) {
    if (!Video.currentVideo) {
      return null
    }
    if (Date.now() - Video.currentVideoHeartbeatTimestamp > maxAge) {
      return null
    }
    return Video.currentVideo
  }

  /**
   * @param {number} [maxAge=10 seconds] Maximum milliseconds passed since the client reported a video as being watched the last time
   */
  static getCurrentYoutubeVideo(maxAge) {
    const video = this.getCurrentVideo(maxAge)
    if (!video) {
      return null
    }
    if (video.extractor !== "youtube") {
      twitch.say("Beim abgespielten Video scheint es sich nicht um ein YouTube-Video zu handeln.")
      return
    }
    return video
  }

  static async getVlcState() {
    if (! apiServer.hasClient()) {
      twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
      return
    }
    const vlcState = await emitPromise.withDefaultTimeout(apiServer.client, "getVlcState")
    if (vlcState === "noVlc") {
      twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
      return
    }
    return vlcState
  }

  static async sendVlcCommand(command, values) {
    if (!apiServer.hasClient()) {
      twitch.say("Ich habe keine Verbindung zum Computer von Jaidchen und kann somit auch das Kino nicht kontaktieren!")
      return
    }
    const commandAction = {
      command,
      ...values,
    }
    const commandResult = await emitPromise.withDefaultTimeout(apiServer.client, "sendVlcCommand", commandAction)
    if (commandResult === "noVlc") {
      twitch.say("Kein Lebenszeichen aus dem Kino, sorry!")
      return
    }
    if (commandResult === "commandFailed") {
      twitch.say("Die Anweisung ans Kino hat jetzt nicht so richtig geklappt.")
      return
    }
    return commandResult
  }

  hasBeenWatched() {
    return this.watchedAt !== null
  }

  /**
   * @async
   * @return {Promise<boolean>}
   */
  async play() {
    if (! apiServer.hasClient()) {
      logger.warn("Couldn't play video #%s, not connected to desktop", this.id)
      return false
    }
    if (!this.videoFile) {
      logger.warn("Tried to play video #%s on desktop, but videoFile is not defined", this.id)
      return false
    }
    return emitPromise.withDefaultTimeout(apiServer.client, "playVideo", pick(this.get(), "videoFile", "timestamp"))
  }

  getDurationMs() {
    return this.vlcDuration || this.duration
  }

  getDurationSeconds() {
    return Math.floor(this.getDurationMs() / 1000)
  }

}

/**
 * @type {import("sequelize").ModelAttributes}
 */
export const schema = {
  // Video meta
  title: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  duration: Sequelize.INTEGER,
  views: Sequelize.BIGINT,
  likes: Sequelize.INTEGER,
  dislikes: Sequelize.INTEGER,
  publishedAt: Sequelize.DATE,
  format: Sequelize.STRING,
  extractor: Sequelize.STRING,
  width: Sequelize.SMALLINT,
  height: Sequelize.SMALLINT,
  webUrl: Sequelize.TEXT,
  audioCodec: Sequelize.STRING,
  videoCodec: Sequelize.STRING,
  formatId: Sequelize.STRING,
  fileExtension: Sequelize.STRING,
  description: Sequelize.TEXT,
  thumbnailUrl: Sequelize.TEXT,
  channelUrl: Sequelize.TEXT,
  audioBitrate: Sequelize.SMALLINT,
  videoBitrate: Sequelize.INTEGER,
  mediaId: Sequelize.STRING,
  ageLimit: Sequelize.SMALLINT,
  publisher: Sequelize.STRING,
  publisherId: Sequelize.STRING,
  info: Sequelize.JSONB,
  // Watching status
  priority: {
    allowNull: false,
    type: Sequelize.SMALLINT,
    defaultValue: 100,
  },
  timestamp: Sequelize.INTEGER,
  watchedAt: Sequelize.DATE,
  skipped: {
    allowNull: false,
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  liked: Sequelize.BOOLEAN,
  frozenUntil: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: 0,
  },
  requestUrl: Sequelize.TEXT,
  // Desktop info
  infoFile: Sequelize.STRING,
  videoFile: Sequelize.STRING,
  bytes: Sequelize.BIGINT,
  downloadedAt: Sequelize.DATE,
  vlcDuration: Sequelize.INTEGER,
  downloadFormat: Sequelize.STRING,
}

export const indexes = [
  {
    unique: true,
    fields: ["extractor", "mediaId"],
  },
]

export default Video