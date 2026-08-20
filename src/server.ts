import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

/**
 * Durable Objects must be exported from the Worker entry, so the entry is
 * overridden here rather than pointing wrangler at the framework default.
 */
export { MayarGate } from "./server/gate"
export { RateLimiter } from "./server/ratelimit"

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
