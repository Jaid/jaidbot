import express from "express"
import {Passport} from "passport"
import {Strategy as TwitchStrategy} from "passport-twitch"
import config from "lib/config"

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
      debugger
    }))
  }

}

export default new Auth