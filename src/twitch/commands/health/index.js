import moment from "lib/moment"
import startDate from "src/startDate"
import Heartbeat from "src/models/Heartbeat"

export default {
  async handle() {
    const infoBlocks = [`v${_PKG_VERSION}`]
    infoBlocks.push(`gestartet ${moment(startDate).fromNow()}`)
    if (Heartbeat.currentStatus) {
      infoBlocks.push(`${Heartbeat.currentStatus.ramUsage}% RAM in Benutzung`)
    }
    return infoBlocks.join(", ")
  },
}