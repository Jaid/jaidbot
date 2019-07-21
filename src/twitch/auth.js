import express from "express"
import {Passport} from "passport"
import {Strategy as TwitchStrategy} from "passport-twitch-new"
import config from "lib/config"
import logger from "lib/logger"

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
    }, (accessToken, refreshToken, profile, done) => {
      logger.info("A")
      debugger
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