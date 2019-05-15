import moment from "moment"
import momentDurationFormat from "moment-duration-format"
import got from "got"
import urlParse from "url-parse"
import fsp from "@absolunet/fsp"
import preventStart from "prevent-start"
import millify from "millify"

momentDurationFormat(moment)

const gotOptions = {
  auth: ":1",
  throwHttpErrors: false,
  retry: {
    retries: 1,
    errorCodes: ["ETIMEDOUT", " ECONNRESET", "EADDRINUSE", "EPIPE", "ENOTFOUND", "ENETUNREACH", "EAI_AGAIN"],
  },
  json: true,
}

export default {
  async handle({senderDisplayName}) {
    let vlcState
    try {
      const {body} = await got("http://127.0.0.1:8080/requests/status.json", {
        ...gotOptions,
      })
      vlcState = body
    } catch {
      return "Kein Lebenszeichen vom Video Player."
    }
    if (vlcState.currentplid === -1) {
      return "Gerade läuft nichts."
    }
    const {body: playlist} = await got("http://127.0.0.1:8080/requests/playlist.json", {
      ...gotOptions,
    })
    const playlistEntry = playlist.children.find(({name}) => name === "Playlist").children.find(({id}) => Number(id) === vlcState.currentplid)
    if (!playlistEntry) {
      return "Irgendwie steige ich gerade nicht in der Playlist durch, sorry!"
    }
    const {pathname: urlPath} = playlistEntry.uri |> decodeURI |> urlParse
    const videoFile = preventStart(urlPath, "/")
    const videoFileExists = await fsp.pathExists(videoFile)
    if (!videoFileExists) {
      return "Dazu finde ich nichts im Dateisystem, sorry!"
    }
    const metaFile = videoFile.replace(/\.(mp4|webm|mov|flv|mkv)$/i, ".info.json")
    const metaFileExists = await fsp.pathExists(metaFile)
    if (!metaFileExists) {
      return "Dazu finde ich in meinen Unterlagen keine brauchbaren Informationen, sorry!"
    }
    const info = await fsp.readJson(metaFile)
    const properties = []
    if (info.height && info.fps) {
      properties.push(`${info.height}p${info.fps}`)
    }
    if (info.age_limit > 0) {
      properties.push(`freigegeben ab ${info.age_limit} Jahren`)
    }
    if (info.duration) {
      properties.push(`${moment.duration(info.duration, "seconds").format("h[h] m[m] s[s]")} Laufzeit`)
    }
    if (info.view_count) {
      properties.push(`${millify(info.view_count, {precision: 0})} Views`)
    }
    if (info.like_count && info.dislike_count) {
      const ratio = Math.floor((info.like_count / (info.like_count + info.dislike_count)) * 100)
      properties.push(`${millify(info.like_count, {precision: 0})} Likes (${ratio}%)`)
    }
    if (info.upload_date) {
      properties.push(`${moment(info.upload_date).locale("de").fromNow()} erschienen`)
    }
    const currentTime = moment.duration(vlcState.time, "seconds").format()
    return `PopCorn ${senderDisplayName}, gerade läuft Stelle ${currentTime} des Videos "${info.fulltitle || info.title}" von ${info.uploader}. ${properties.join(", ")}.`
  },
}