import twitch from "src/plugins/twitch"

export default async event => {
  /**
   * @type {import("@octokit/webhooks").WebhookPayloadCheckRun}
   */
  const payload = event.payload
  /**
   * @type {import("@octokit/rest").Octokit}
   */
  const github = event.github
  if (payload.repository.private) {
    return
  }
  // const checkRun = await github.checks.get({
  //   owner: payload.repository.owner.login,
  //   repo: payload.repository.name,
  //   check_run_id: payload.check_run.id,
  // })
  // const checkSuite = await github.checks.getSuite({
  //   owner: payload.repository.owner.login,
  //   repo: payload.repository.name,
  //   check_suite_id: payload.check_run.check_suite.id,
  // })
  if (payload.check_run.conclusion === "success") {
    return
  }
  twitch.say(`Action für ${payload.repository.name} ist fehlgeschlagen (${payload.check_run.conclusion}): ${payload.check_run.html_url}`)
}