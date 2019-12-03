import fsp from "@absolunet/fsp"
import Octokit from "@octokit/rest"
import {isEmpty} from "has-content"
import pMap from "p-map"
import {createProbot} from "probot"
import zahl from "zahl"

import {logger} from "src/core"
import twitch from "src/plugins/twitch"

import checkRunCompleted from "./events/checkRunCompleted"
import releasePublished from "./events/releasePublished"

export default class StarredReleaseNotifier {

    /**
     * @type {import("@octokit/rest").Octokit}
     */
    github = null

    async init() {
      if (isEmpty(this.token) || isEmpty(this.user) || isEmpty(this.pollInterval) || isEmpty(this.pemFile)) {
        return false
      }
      const cert = await fsp.readFile(this.pemFile, "utf8")
      this.probot = createProbot({
        cert,
        secret: this.webhookSecret,
        id: this.appId,
        port: this.webhookPort,
      })
      /**
       * @type {import("probot").Application}
       */
      this.probotApp = this.probot.load(app => {
        app.on("check_run.completed", checkRunCompleted)
        app.on("release.published", releasePublished)
      })
      this.probot.start()
      logger.info("GitHub app %s is listening to webhook port %s", this.appId, this.webhookPort)
      try {
        this.github = new Octokit({
          log: logger,
          userAgent: `${_PKG_TITLE} v${_PKG_VERSION}`,
          auth: this.token,
        })
      } catch (error) {
        this.github = new Octokit
        logger.warn("Could not create a GitHub API client with auth options")
        logger.error("GitHub API client creation failed: %s", error)
      }
    }

    handleConfig(config) {
      this.user = config.starredReleasesUser
      this.pollInterval = config.starredReleasesPollIntervalSeconds * 1000
      this.pemFile = config.githubAppPemFilePath
      this.appId = config.githubAppId
      this.webhookSecret = config.githubAppWebhookSecret
      this.webhookPort = config.githubWebhookPort
      this.token = config.githubToken
    }

    postInit() {
      return twitch.isReady
    }

    async ready() {
      const starredRepos = await this.github.paginate(`/users/${this.user}/starred`)
      const filteredRepos = starredRepos.filter(({archived, has_downloads, disabled}) => !archived && !disabled && has_downloads)
      const checkedRepos = await pMap(filteredRepos, async repo => {
        try {
          const release = await this.github.repos.getLatestRelease({
            owner: repo.owner.login,
            repo: repo.name,
          })
          return {
            owner: repo.owner.login,
            name: repo.name,
            latestTag: release.data.tag_name,
          }
        } catch (error) {
          return false
        }
      }, {concurrency: 20})
      this.repos = checkedRepos.filter(repo => repo)
      setInterval(() => {
        this.check()
      }, this.pollInterval)
      await this.check()
      logger.info("Started StarredReleaseNotifier for %s", zahl(this.repos, "repo"))
    }

    async check() {
      this.repos.map(async repo => {
        const release = await this.github.repos.getLatestRelease({
          owner: repo.owner,
          repo: repo.name,
        })
        if (repo.latestTag !== release.data.tag_name) {
          repo.latestTag = release.data.tag_name
          twitch.say(`ChefFrank Neue Version von ${repo.name}! github.com/${repo.owner}/${repo.name}/releases/${release.data.tag_name}`)
        }
      })
    }

}