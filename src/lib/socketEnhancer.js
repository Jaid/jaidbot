import SocketEnhancer from "socket-enhance"
import logger from "lib/logger"

/**
 * @type {import("socket-enhance").SocketEnhancer}
 */
const socketEnhancer = new SocketEnhancer({logger})

export default socketEnhancer