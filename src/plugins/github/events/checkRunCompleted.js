import {isEmpty} from "has-content"

import twitch from "src/plugins/twitch"

export default async event => {
  /**
   * @type {import("@octokit/webhooks").WebhookPayloadCheckRun}
   */
  const payload = event.payload
  if (payload.repository.private) {
    return
  }
  if (payload.check_run.conclusion === "success") {
    return
  }
  twitch.say(`Action für ${payload.repository.name} ist fehlgeschlagen (${payload.check_run.conclusion}): ${payload.check_run.html_url}`)
}