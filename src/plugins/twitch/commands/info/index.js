import {isNumber} from "lodash"
import millify from "millify"

import moment from "lib/moment"

import Video from "src/models/Video"

export default {
  needsDesktopClient: true,
  async handle({senderName}) {
    const video = Video.getCurrentVideo()
    if (!video) {
      return `Gerade läuft doch gar kein Video, ${senderName}!`
    }
    const properties = []
    const durationMs = video.getDurationMs()
    if (durationMs) {
      properties.push(`${moment.duration(durationMs, "milliseconds").format()} Laufzeit`)
    }
    if (video.height) {
      if (video.info?.fps) {
        properties.push(`${video.height}p${video.info.fps}`)
      } else {
        properties.push(`${video.height}p`)
      }
    }
    if (video.ageLimit > 0) {
      properties.push(`freigegeben ab ${video.ageLimit} Jahren`)
    }
    if (video.views) {
      properties.push(`${millify(video.views, {precision: 0})} Views`)
    }
    if (isNumber(video.likes) && isNumber(video.dislikes)) {
      if (video.likes + video.dislikes === 0) {
        properties.push("keine Bewertungen")
      } else {
        let ratio
        if (video.dislikes === 0) {
          ratio = 100
        } else if (video.likes === 0) {
          ratio = 0
        } else {
          ratio = Math.floor(video.likes / (video.likes + video.dislikes) * 100)
        }
        properties.push(`${millify(video.likes, {precision: 0})} Likes (${ratio}%)`)
      }
    }
    if (video.publishedAt) {
      properties.push(`${moment(video.publishedAt).fromNow()} erschienen`)
    } else {
      properties.push(`${moment(video.createdAt).fromNow()} hinzugefügt`)
    }
    const currentTime = moment.duration(video.timestamp, "milliseconds").format()
    return `PopCorn ${senderName}, gerade läuft Stelle ${currentTime} des Videos "${video.title}" von ${video.publisher}. ${properties.join(", ")}.`
  },
}