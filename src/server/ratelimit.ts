import { DurableObject } from "cloudflare:workers"

/**
 * Checkouts allowed per IP inside the window.
 *
 * The point of this app is to try eight billing models one after another, so a
 * cap of five would stop a visitor at the sixth page. The tight limit was set
 * while running against production, where every checkout moved real money.
 * In sandbox that reason is gone, so the cap only has to stop a runaway script
 * from exhausting the shared 50 requests per minute.
 *
 * Production keeps the strict cap, because there the cost of abuse is money.
 */
const LIMITS = {
  production: { limit: 5, windowMs: 3 * 60 * 1000 },
  sandbox: { limit: 40, windowMs: 5 * 60 * 1000 },
} as const

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
  private get policy() {
    const configured: string = this.env.MAYAR_ENV
    return configured === "production" ? LIMITS.production : LIMITS.sandbox
  }

  async take(): Promise<RateLimitVerdict> {
    const { limit: LIMIT, windowMs: WINDOW_MS } = this.policy
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
    const { windowMs: WINDOW_MS } = this.policy
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
