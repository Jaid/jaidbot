import EventEmitter from "events"
import http from "http"

import socketIo from "socket.io"
import config from "lib/config"
import logger from "lib/logger"

class Server extends EventEmitter {

  async init() {
    this.httpServer = http.createServer()
    this.io = socketIo(this.httpServer, {
      serveClient: false,
      wsEngine: "ws",
    })
    this.io.on("connection", client => {
      if (client.handshake.query.password !== config.server.password) {
        logger.warn("Received wrong password from client %s, disconnecting", client.handshake.address)
        client.disconnect()
      }
      if (this.client) {
        logger.warn("Client %s tried to connect, but another client is already here", client.handshake.address)
        client.disconnect()
      }
      this.client = client
      client.on("disconnect", () => {
        logger.info("Client %s has disconnected", client.handshake.address)
        delete this.client
      })
      logger.info("New connection from %s", client.handshake.address)
    })
    const port = config.server.port
    this.io.listen(port)
    logger.info("Jaidbot server runs on port %s", port)
  }

}

export default new Server