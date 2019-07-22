import ms from "ms.macro"

class HeartbeatEmitter {

  async init() {
    setTimeout(() => {
      this.update()
    }, ms`1 minute`)
  }

}

export default HeartbeatEmitter