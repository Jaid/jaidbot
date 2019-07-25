import Sequelize, {Op} from "sequelize"
import logger from "lib/logger"
import config from "lib/config"
import vlc from "lib/vlc"
import execa from "execa"
import {isString} from "lodash"
import moment from "lib/moment"
import server from "src/server"
import TwitchUser from "src/models/TwitchUser"
import ms from "ms.macro"
import emitPromise from "emit-promise"

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
 */

/**
 * @typedef {Object} VlcState
 * @prop {number} durationMs
 * @prop {string} file
 * @prop {number} position
 * @prop {string} state
 * @prop {number} timestampMs
 */

/**
 * @callback VlcStateEvent
 * @param {VlcState} state
 */

class Video extends Sequelize.Model {

  static associate(models) {
    Video.belongsTo(models.TwitchUser, {
      as: "Requester",
      foreignKey: "RequesterId",
    })
  }

  static start() {
    server.on("gotClient", client => {
      client.on("videoDownloaded", async ({videoId, bytes, videoFile, infoFile}) => {
        const video = await Video.findByPk(videoId)
        video.bytes = bytes
        video.videoFile = videoFile
        video.infoFile = infoFile
        video.downloadedAt = new Date
        await video.save({
          fields: ["bytes", "videoFile", "infoFile", "downloadedAt"],
        })
      })
      client.on("getNextVideo", async callback => {
        const nextVideo = await Video.findOne({
          where: {
            watchedAt: {
              [Op.eq]: null,
            },
            videoFile: {
              [Op.ne]: null,
            },
          },
          order: [
            ["priority", "desc"],
            ["createdAt", "asc"],
          ],
          attributes: ["infoFile", "videoFile", "timestamp"],
          raw: true,
        })
        if (nextVideo) {
          callback(nextVideo)
          return
        } else {
          callback(false)
          return
        }
      })
      client.on("vlcState", /** @type {VlcState} */ async state => {
        const unwatchedVideo = await Video.findOne({
          where: {
            watchedAt: {
              [Op.eq]: null,
            },
            videoFile: state.file,
          },
        })
        if (!unwatchedVideo) {
          return
        }
        unwatchedVideo.vlcDuration = state.durationMs
        unwatchedVideo.timestamp = state.timestampMs
        const remainingTime = state.durationMs - state.timestampMs
        if (remainingTime < ms`10 seconds`) {
          unwatchedVideo.watchedAt = moment().add(remainingTime, "ms").toDate()
        }
        await unwatchedVideo.save()
      })
      client.on("setInfoFile", async ({videoId, infoFile}) => {
        await Video.update({infoFile}, {
          where: {
            id: videoId,
          },
        })
      })
      client.on("getDownloadJobs", async callback => {
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
      })
    })
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
      execResult = await execa(config.youtubeDlPath, [...vlc.youtubeDlParams, "--dump-single-json", url])
      videoInfo = execResult.stdout |> JSON.parse
    } catch (error) {
      logger.error("Could not use youtube-dl to fetch media information of url %s: %s\ncommand: %s\nstd: %s", url, error, execResult?.command || error?.command, execResult?.all || error?.all)
    }
    if (!videoInfo && server.hasClient()) {
      logger.warn("Could not fetch info for %s, trying on Desktop instead", url)
      videoInfo = await emitPromise(server.client, "fetchVideoInfo", url)
    }
    if (videoInfo) {
      return Video.queueByInfo(videoInfo, options)
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
      downloadFormat: vlc.downloadFormat,
    }
    if (options.priority !== undefined) {
      videoValues.priority = options.priority
    }
    if (options.requesterTwitchId) {
      const twitchUser = await TwitchUser.getByTwitchId(options.requesterTwitchId)
      videoValues.RequesterId = twitchUser.id
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
      if (server.hasClient()) {
        server.client.emit("queueInfo", {
          videoInfo,
          videoId: video.id,
          downloadFormat: video.downloadFormat,
        })
      }
    }
    return video
  }

}

export const schema = {
  // Video meta
  title: {
    allowNull: false,
    type: Sequelize.STRING,
  },
  duration: Sequelize.INTEGER,
  views: Sequelize.INTEGER,
  likes: Sequelize.INTEGER,
  dislikes: Sequelize.INTEGER,
  publishedAt: Sequelize.DATE,
  format: Sequelize.STRING,
  extractor: Sequelize.STRING,
  width: Sequelize.INTEGER,
  height: Sequelize.INTEGER,
  webUrl: Sequelize.TEXT,
  audioCodec: Sequelize.STRING,
  videoCodec: Sequelize.STRING,
  formatId: Sequelize.STRING,
  fileExtension: Sequelize.STRING,
  description: Sequelize.TEXT,
  thumbnailUrl: Sequelize.TEXT,
  channelUrl: Sequelize.TEXT,
  audioBitrate: Sequelize.INTEGER,
  videoBitrate: Sequelize.INTEGER,
  mediaId: Sequelize.STRING,
  ageLimit: Sequelize.INTEGER,
  publisher: Sequelize.STRING,
  publisherId: Sequelize.STRING,
  info: Sequelize.JSONB,
  // Watching status
  priority: {
    allowNull: false,
    type: Sequelize.INTEGER,
    defaultValue: 100,
  },
  timestamp: Sequelize.INTEGER,
  watchedAt: Sequelize.DATE,
  // Desktop info
  infoFile: Sequelize.STRING,
  videoFile: Sequelize.STRING,
  bytes: Sequelize.INTEGER,
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