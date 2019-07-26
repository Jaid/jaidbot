import moment from "lib/moment"
import millify from "millify"
import filesize from "filesize"
import vlc from "lib/vlc"
import {isNumber} from "lodash"

export default {
  needsDesktopClient: true,
  async handle({sender}) {
    const result = await vlc.getCurrentVideo()
    if (!result) {
      return
    }
    const {videoInfo, vlcState, videoSize} = result
    const properties = []
    if (videoInfo.height && videoInfo.fps) {
      properties.push(`${videoInfo.height}p${videoInfo.fps}`)
    }
    if (videoInfo.age_limit > 0) {
      properties.push(`freigegeben ab ${videoInfo.age_limit} Jahren`)
    }
    if (videoInfo.duration) {
      properties.push(`${moment.duration(videoInfo.duration, "seconds").format()} Laufzeit`)
    }
    if (videoSize > 1000) {
      properties.push(filesize(videoSize, {round: 0}))
    }
    if (videoInfo.view_count) {
      properties.push(`${millify(videoInfo.view_count, {precision: 0})} Views`)
    }
    if (isNumber(videoInfo.like_count) && isNumber(videoInfo.dislike_count)) {
      if (videoInfo.like_count + videoInfo.dislike_count === 0) {
        properties.push("keine Bewertungen")
      } else {
        let ratio
        if (videoInfo.dislike_count === 0) {
          ratio = 100
        } else if (videoInfo.like_count === 0) {
          ratio = 0
        } else {
          ratio = Math.floor(videoInfo.like_count / (videoInfo.like_count + videoInfo.dislike_count) * 100)
        }
        properties.push(`${millify(videoInfo.like_count, {precision: 0})} Likes (${ratio}%)`)
      }
    }
    if (videoInfo.upload_date) {
      properties.push(`${moment(videoInfo.upload_date).fromNow()} erschienen`)
    }
    const currentTime = moment.duration(vlcState.time, "seconds").format()
    return `PopCorn ${sender.displayName}, gerade läuft Stelle ${currentTime} des Videos "${videoInfo.fulltitle || videoInfo.title}" von ${videoInfo.uploader}. ${properties.join(", ")}.`
  },
}