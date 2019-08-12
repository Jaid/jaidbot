import EventEmitter from "events"

import core, {logger, config} from "src/core"
import twitch from "src/twitch"
import socketEnhancer from "lib/socketEnhancer"
import socketIo from "socket.io"

class ApiServer extends EventEmitter {

  async init() {
    this.socketServer = socketIo(core.insecureServer)
    this.socketServer.on("connection", client => {
      if (client.handshake.query.password !== config.serverPassword) {
        logger.warn("Received wrong password from client %s, disconnecting", client.handshake.address)
        client.disconnect()
        return
      }
      if (this.hasClient()) {
        logger.warn("Client %s tried to connect, but another client is already here", client.handshake.address)
        client.disconnect()
        return
      }
      this.client = client
      client.on("disconnect", () => {
        delete this.client
        logger.info("Client %s has disconnected", client.handshake.address)
        twitch.say("Uff, ich habe die Verbindung zum Computer von Jaidchen verloren.")
      })
      this.emit("gotClient", client)
      twitch.say("Ich bin jetzt mit dem Computer von Jaidchen verbunden!")
    })
    socketEnhancer.enhanceServer(this.socketServer)
  }

  hasClient() {
    return Boolean(this.client)
  }

}

export default new ApiServer