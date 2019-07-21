import express from "express"
import {Passport} from "passport"
import {Strategy as TwitchStrategy} from "passport-twitch-new"
import config from "lib/config"
import logger from "lib/logger"
import TwitchUser from "src/models/TwitchUser"

import indexContent from "!raw-loader!./index.html"

class Auth {

  async init() {
    this.app = express()
    this.passport = new Passport()

    this.app.use(this.passport.initialize())

    this.passport.use(new TwitchStrategy({
      clientID: config.twitchClientId,
      clientSecret: config.twitchClientSecret,
      callbackURL: config.twitchClientCallbackUrl,
      scope: [
        "user:edit:broadcast",
        "user:edit",
        "channel:read:subscriptions",
        "user:read:broadcast",
        "channel_editor",
        "channel_read",
      ],
    }, async (accessToken, refreshToken, profile, done) => {
      await TwitchUser.upsert({
        accessToken,
        refreshToken,
        broadcasterType: profile.broadcaster_type,
        description: profile.description,
        displayName: profile.display_name,
        twitchId: profile.id,
        loginName: profile.login,
        offlineImageUrl: profile.offline_image_url,
        avatarUrl: profile.profile_image_url,
        viewCount: profile.view_count,
      })
      const user = await TwitchUser.findOne({
        where: {
          twitchId: profile.id,
        },
      })
      logger.info("Login from Twitch user %s", profile.login)
      done(user.loginName)
    }))

    this.app.get("/", (request, response) => {
      response.send(indexContent)
    })
    this.app.get("/auth/twitch", this.passport.authenticate("twitch"))
    this.app.get("/auth/twitch/callback", this.passport.authenticate("twitch", {failureRedirect: "/"}), (request, response) => {
      response.send("OK")
    })

    this.app.listen(config.twitchAuthPort)
    logger.info("Starting Twitch auth server on port %o", config.twitchAuthPort)
  }

}

export default new Auth