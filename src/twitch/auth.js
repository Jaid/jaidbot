import express from "express"
import {Passport} from "passport"
import {Strategy as TwitchStrategy} from "passport-twitch-new"
import config from "lib/config"
import logger from "lib/logger"
import TwitchUser from "src/models/TwitchUser"

import scope from "./scope"

import indexContent from "!raw-loader!./index.html"

class Auth {

  async init() {
    this.app = express()
    this.passport = new Passport()

    this.app.use(this.passport.initialize())

    this.passport.use(new TwitchStrategy({
      scope,
      clientID: config.twitchClientId,
      clientSecret: config.twitchClientSecret,
      callbackURL: config.twitchClientCallbackUrl,
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
      logger.info("Login from Twitch user %s", profile.login)
      done()
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