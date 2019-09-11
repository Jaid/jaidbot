import humanizeDuration from "humanize-duration"

export const hoursMinutesHumanize = humanizeDuration.humanizer({
  language: "de",
  conjunction: " und ",
  serialComma: false,
  maxDecimalPoints: 0,
  units: ["h", "m"],
})

export default humanizeDuration.humanizer({
  language: "de",
  conjunction: " und dann noch mal ",
  serialComma: false,
  maxDecimalPoints: 0,
})