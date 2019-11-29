import twitch from "src/plugins/twitch"

export default async event => {
  /**
   * @type {import("@octokit/webhooks").WebhookPayloadRelease}
   */
  const payload = event.payload
  if (payload.repository.private) {
    return
  }
  twitch.say(`${payload.release.name} ist da: ${payload.release.html_url}`)
}