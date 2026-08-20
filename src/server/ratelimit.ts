import { DurableObject } from "cloudflare:workers"

/**
 * Checkouts allowed per IP inside the window.
 *
 * The window is short on purpose. A visitor who trips this is usually trying
 * the demo, not attacking it, and a ten-minute lockout ends their visit. Three
 * minutes still throttles a script hard enough to protect the shared Mayar
 * budget, because a script cannot pay the invoices it creates.
 */
const LIMIT = 5
const WINDOW_MS = 3 * 60 * 1000

export interface RateLimitVerdict {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * One instance per client IP.
 *
 * This demo is public, charges real money, and shares a single Mayar API key
 * whose limit is 50 requests per minute for everyone at once. Without a cap, a
 * single script could exhaust that budget and break all eight pages for every
 * other visitor.
 */
export class RateLimiter extends DurableObject<Env> {
  async take(): Promise<RateLimitVerdict> {
    const now = Date.now()
    const hits = (await this.ctx.storage.get<number[]>("hits")) ?? []
    const fresh = hits.filter((at) => now - at < WINDOW_MS)

    if (fresh.length >= LIMIT) {
      const oldest = fresh[0]
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
      }
    }

    fresh.push(now)
    await this.ctx.storage.put("hits", fresh)
    // Clean up after the window so idle IPs do not keep storage alive.
    await this.ctx.storage.setAlarm(now + WINDOW_MS + 1000)

    return {
      allowed: true,
      remaining: LIMIT - fresh.length,
      retryAfterSeconds: 0,
    }
  }

  async alarm(): Promise<void> {
    const now = Date.now()
    const hits = (await this.ctx.storage.get<number[]>("hits")) ?? []
    const fresh = hits.filter((at) => now - at < WINDOW_MS)

    if (fresh.length === 0) {
      await this.ctx.storage.deleteAll()
      return
    }

    // Some hits are still inside the window. Keep them and check again later.
    await this.ctx.storage.put("hits", fresh)
    await this.ctx.storage.setAlarm(fresh[0] + WINDOW_MS + 1000)
  }
}
