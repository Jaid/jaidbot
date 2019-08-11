import EventEmitter from "events"
import http from "http"

import socketIo from "socket.io"
import core, {logger, config} from "src/core"
import twitch from "src/twitch"
import socketEnhancer from "lib/socketEnhancer"

class ApiServer extends EventEmitter {

  constructor() {
    super()
    core.hooks.init.tapPromise("apiServer", async () => {
      this.httpServer = http.createServer()
      this.io = socketIo(this.httpServer)
      this.io.on("connection", client => {
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
      socketEnhancer.enhanceServer(this.io)
      const port = config.serverPort
      // core.once("ready", () => {
      //   try {
      //     this.io.listen(port)
      //   } catch (error) {
      //     logger.error("Error in core.ready handler in server: %s", error)
      //   }
      // })
      logger.info("Jaidbot server runs on port %s", port)
    })
  }

  hasClient() {
    return Boolean(this.client)
  }

}

export default new ApiServer