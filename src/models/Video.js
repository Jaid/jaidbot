import Sequelize, {Op} from "sequelize"
import logger from "lib/logger"
import config from "lib/config"
import vlc from "lib/vlc"
import execa from "execa"
import {isString} from "lodash"
import moment from "lib/moment"
import server from "src/server"
import TwitchUser from "src/models/TwitchUser"

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
 * @typedef {Object} QueueResult
 * @prop {Video} video
 * @prop {YoutubeDlInfo} videoInfo
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
    })
  }

  /**
   * @async
   * @function
   * @param {string} url
   * @param {QueueOptions} [options]
   * @return {Promise<QueueResult>}
   */
  static async queueByUrl(url, options) {
    let execResult
    try {
      execResult = await execa(config.youtubeDlPath, [...vlc.youtubeDlParams, "--dump-single-json", url])
      const videoInfo = execResult.stdout |> JSON.parse
      const queueResult = await Video.queueByInfo(videoInfo, options)
      return queueResult
    } catch (error) {
      logger.error("Could not use youtube-dl to fetch media information of url %s: %s\ncommand: %s\nstd: %s", url, error, execResult.command, execResult.all)
    }
  }

  /**
   * @async
   * @function
   * @param {YoutubeDlInfo} info
   * @param {QueueOptions} [options]
   * @return {Promise<QueueResult>}
   */
  static async queueByInfo(info, options) {
    const publishDateString = info.release_date || info.upload_date
    let publishDate
    if (publishDateString |> isString) {
      publishDate = moment(publishDateString, "YYYYMMDD").toDate()
    }
    const videoValues = {
      title: info.title || info.webpage_url,
      duration: info.duration * 1000,
      views: info.view_count,
      likes: info.like_count,
      dislikes: info.dislike_count,
      publishedAt: publishDate,
      format: info.format,
      extractor: info.extractor || info.extractor_key,
      width: info.width,
      height: info.height,
      webUrl: info.webpage_url || info.channel_url || info.uploader_url,
      audioCodec: info.acodec,
      videoCodec: info.vcodec,
      formatId: info.format_id,
      fileExtension: info.ext,
      description: info.description,
      thumbnailUrl: info.thumbnail,
      channelUrl: info.channel_url || info.uploader_url,
      audioBitrate: info.abr,
      videoBitrate: info.vbr,
      mediaId: info.id,
      ageLimit: info.age_limit,
      publisher: info.uploader || info.uploader_id,
      publisherId: info.uploader_id,
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
    }
    return {
      video,
      videoInfo: info,
    }
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
}

export const indexes = [
  {
    unique: true,
    fields: ["extractor", "mediaId"],
  },
]

export default Video