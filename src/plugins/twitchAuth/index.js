import Router from "@koa/router"
import passport from "koa-passport"
import {Strategy as TwitchStrategy} from "passport-twitch-new"

import core, {config, logger} from "src/core"
import TwitchUser from "src/models/TwitchUser"

import scope from "./scope"

import indexContent from "!raw-loader!./index.html"

class Auth {

  async ready() {
    passport.use(new TwitchStrategy({
      scope,
      clientID: config.twitchClientId,
      clientSecret: config.twitchClientSecret,
      callbackURL: config.twitchClientCallbackUrl,
    }, async (accessToken, refreshToken, profile, done) => {
      await TwitchUser.findOrRegisterById(profile.id, {
        defaults: {
          accessToken,
          refreshToken,
        },
      })
      logger.info("Login from Twitch user %s", profile.login)
      done()
    }))
    core.koa.use(passport.initialize())
    this.router = new Router()
    this.router.get("/", context => {
      context.type = "html"
      context.body = indexContent
    })
    this.router.get("/auth/twitch", passport.authenticate("twitch"))
    this.router.get("/auth/twitch/callback", passport.authenticate("twitch", {failureRedirect: "/"}), context => {
      context.body = "OK"
    })
    core.koa.use(this.router.routes())
  }

}

export default new Auth