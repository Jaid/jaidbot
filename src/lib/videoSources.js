import emitPromise from "emit-promise"

import apiServer from "src/plugins/apiServer"

const sourceNames = [
  "VLC",
  "VLC Fullscreen",
]

export async function showVideoSources() {
  const jobs = sourceNames.map(async sourceName => {
    await emitPromise.withDefaultTimeout(apiServer.client, "showObsSource", sourceName)
  })
  return Promise.all(jobs)
}

export async function hideVideoSources() {
  const jobs = sourceNames.map(async sourceName => {
    await emitPromise.withDefaultTimeout(apiServer.client, "hideObsSource", sourceName)
  })
  return Promise.all(jobs)
}