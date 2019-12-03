import {google} from "googleapis"

import {config} from "src/core"

const auth = new google.auth.OAuth2(config.youtubeClientId, config.youtubeClientSecret, config.youtubeClientRedirectUrl)
auth.setCredentials({
  refresh_token: config.youtubeClientRefreshToken,
})
const youtube = google.youtube({
  auth,
  version: "v3",
})

export default youtube