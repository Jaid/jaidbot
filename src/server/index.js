import EventEmitter from "events"
import http from "http"

import socketIo from "socket.io"
import config from "lib/config"
import logger from "lib/logger"
import twitch from "src/twitch"
import socketEnhancer from "lib/socketEnhancer"

class Server extends EventEmitter {

  async init() {
    this.httpServer = http.createServer()
    this.io = socketIo(this.httpServer, {
      serveClient: false,
      wsEngine: "ws",
    })
    this.io.on("connection", client => {
      if (client.handshake.query.password !== config.serverPassword) {
        logger.warn("Received wrong password from client %s, disconnecting", client.handshake.address)
        client.disconnect()
      }
      if (this.hasClient()) {
        logger.warn("Client %s tried to connect, but another client is already here", client.handshake.address)
        client.disconnect()
      }
      this.client = client
      client.on("disconnect", () => {
        delete this.client
        logger.info("Client %s has disconnected", client.handshake.address)
        twitch?.say("Uff, ich habe die Verbindung zum Computer von Jaidchen verloren.")
      })
      logger.info("New connection from %s", client.handshake.address)
      this.emit("gotClient", client)
      twitch?.say("Ich bin jetzt mit dem Computer von Jaidchen verbunden!")
    })
    socketEnhancer.enhanceServer(this.io)
    const port = config.serverPort
    this.io.listen(port)
    logger.info("Jaidbot server runs on port %s", port)
  }

  hasClient() {
    return Boolean(this.client)
  }

}

export default new Server