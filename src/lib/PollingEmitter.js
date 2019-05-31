import EventEmitter from "events"

import {isEmpty, isFunction} from "lodash"

export default class extends EventEmitter {

  constructor(options) {
    super()
    this.options = {
      pollIntervalSeconds: 10,
      autostart: true,
      ...options,
    }
    this.processedEntryIds = new Set
    if (this.options.autostart) {
      this.start()
    }
  }

  start() {
    if (this.interval) {
      this.interval.unref()
    }
    this.interval = setInterval(async () => {
      try {
        const fetchedEntries = await this.fetchEntries()
        if (!fetchedEntries) {
          return
        }
        const unprocessedEntries = fetchedEntries.filter(entry => !this.hasAlreadyProcessedEntry(entry))
        if (unprocessedEntries |> isEmpty) {
          return
        }
        for (const entry of unprocessedEntries) {
          const id = this.getIdFromEntry(entry)
          this.processedEntryIds.add(id)
          if (this.processEntry |> isFunction) {
            const shouldEmitEntry = await this.processEntry(entry, id)
            if (shouldEmitEntry === false) {
              return
            }
          }
          this.emit("newEntry", entry, id)
        }
      } catch (error) {
        this.handleError?.(error)
      }
    }, this.options.pollIntervalSeconds * 1000)
  }

  hasAlreadyProcessedEntry(entry) {
    return this.processedEntryIds.has(this.getIdFromEntry(entry))
  }

  hasAlreadyProcessedEntryId(entryId) {
    return this.processedEntryIds.has(entryId)
  }

  getIdFromEntry(entry) {
    return entry.id
  }

  async fetchEntries() {
    throw new Error("PollingEmitter.fetchEntries has to be overwritten by subclass")
  }

}