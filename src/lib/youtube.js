import {google} from "googleapis"

const auth = new google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, "http://localhost")
auth.setCredentials({
  refresh_token: require("C:/Users/Jaid/youtubeToken.json").refresh_token,
})
export default google.youtube({
  auth,
  version: "v3",
})