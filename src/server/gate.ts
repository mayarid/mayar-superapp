import { DurableObject } from "cloudflare:workers"
import { getMayarConfig } from "../lib/mayar/config"
import { listPaidTransactions } from "../lib/mayar/operations"
import { fulfil } from "./fulfillment"
import {
  expireStale,
  getOrder,
  listPending,
  markAmbiguous,
  markPaid,
} from "./orders"
import type { TransactionListItem } from "../lib/mayar/types"
import type { Order } from "./orders"

/** Mayar's documented limit: 50 requests per minute per API key. */
const CAPACITY = 50
const REFILL_WINDOW_MS = 60_000

/**
 * Tokens the reconciler refuses to dip below, so a busy polling cycle can never
 * starve a visitor trying to check out.
 */
const RESERVED_FOR_USERS = 20

/** How often the reconciler asks Mayar what has been paid. */
const TICK_MS = 5_000

/** How far back a payment can be matched to an order. */
const MATCH_WINDOW_MS = 45 * 60 * 1000

interface Bucket {
  tokens: number
  updatedAt: number
}

export interface AcquireResult {
  granted: boolean
  /** Tokens left after this call. */
  remaining: number
}

/**
 * The single gate in front of every Mayar call, and the reconciler.
 *
 * There is exactly one instance of this object. Two responsibilities live here
 * because they compete for the same scarce resource — the 50 requests per
 * minute that the whole application shares — and splitting them would mean
 * neither could see the other's spending.
 *
 * The reconciler exists because this app registers no webhook. It polls the
 * transaction *list* rather than each order, so one request covers up to fifty
 * in-flight orders instead of one.
 */
export class MayarGate extends DurableObject<Env> {
  private async bucket(): Promise<Bucket> {
    const stored = await this.ctx.storage.get<Bucket>("bucket")
    return stored ?? { tokens: CAPACITY, updatedAt: Date.now() }
  }

  /**
   * Takes tokens from the shared budget.
   *
   * `minRemaining` lets a background caller leave headroom for user-facing
   * work. The reconciler passes a reserve; a checkout request passes zero.
   */
  async acquire(cost = 1, minRemaining = 0): Promise<AcquireResult> {
    const now = Date.now()
    const bucket = await this.bucket()

    const elapsed = now - bucket.updatedAt
    const refilled = Math.min(
      CAPACITY,
      bucket.tokens + (elapsed / REFILL_WINDOW_MS) * CAPACITY
    )

    if (refilled - cost < minRemaining) {
      await this.ctx.storage.put("bucket", { tokens: refilled, updatedAt: now })
      return { granted: false, remaining: Math.floor(refilled) }
    }

    const tokens = refilled - cost
    await this.ctx.storage.put("bucket", { tokens, updatedAt: now })
    return { granted: true, remaining: Math.floor(tokens) }
  }

  /**
   * Arms the reconciler. Called when an order starts waiting for payment.
   *
   * The alarm is only ever set while work exists. An alarm that keeps firing
   * over an empty table costs money and buys nothing.
   */
  async wake(): Promise<void> {
    const existing = await this.ctx.storage.getAlarm()
    if (existing === null) {
      await this.ctx.storage.setAlarm(Date.now() + TICK_MS)
    }
  }

  async alarm(): Promise<void> {
    let pendingRemains = false
    try {
      pendingRemains = await this.reconcile()
    } catch (error) {
      // A failed tick must not kill the loop; orders would hang unpaid forever.
      console.error("reconcile failed", error)
      pendingRemains = true
    }

    if (pendingRemains) {
      await this.ctx.storage.setAlarm(Date.now() + TICK_MS)
    }
  }

  /** Returns true when orders are still waiting and the alarm should re-arm. */
  private async reconcile(): Promise<boolean> {
    const db = this.env.DB

    await expireStale(db)
    const pending = await listPending(db)
    if (pending.length === 0) return false

    const budget = await this.acquire(1, RESERVED_FOR_USERS)
    if (!budget.granted) {
      // Out of headroom this minute. Try again on the next tick rather than
      // spending tokens a visitor needs to check out.
      return true
    }

    const oldest = Math.min(...pending.map((order) => order.created_at))
    const page = await listPaidTransactions(getMayarConfig(), {
      startAt: oldest - 60_000,
      endAt: Date.now() + 60_000,
    })

    if (page.hasMore) {
      // Never silently truncate. If this appears, the window is too wide or
      // traffic outgrew a single page.
      console.warn(
        `reconcile: more than ${page.items.length} paid transactions in window; ` +
          `cursor ${page.nextStartingAfter} not followed`
      )
    }

    await this.settle(db, pending, page.items)
    return (await listPending(db)).length > 0
  }

  /**
   * Matches paid transactions to waiting orders.
   *
   * Proof strength differs by model. An order created through an endpoint that
   * returned a transaction id is matched on that id and is certain. The QRIS
   * and credit models get no id back from Mayar, so they are matched on a
   * unique amount or on the buyer's email inside a time window.
   *
   * Both heuristics fail closed: an order is only settled when exactly one
   * transaction matches it and that transaction matches no other order.
   */
  private async settle(
    db: D1Database,
    pending: Order[],
    transactions: TransactionListItem[]
  ): Promise<void> {
    const claimed = new Set<string>()

    // Certain matches run first so a transaction with a known id can never be
    // stolen by a weaker amount or email match.
    for (const order of pending) {
      if (!order.transaction_id) continue
      const hit = transactions.find((item) => item.id === order.transaction_id)
      if (hit) {
        claimed.add(hit.id)
        await this.confirm(db, order, hit.id)
      }
    }

    for (const order of pending) {
      if (order.transaction_id) continue

      const candidates = transactions.filter((item) => {
        if (claimed.has(item.id)) return false
        if (Math.abs(item.createdAt - order.created_at) > MATCH_WINDOW_MS)
          return false

        if (order.match_amount !== null)
          return item.amount === order.match_amount
        if (order.match_email !== null) {
          return (
            item.customer?.email.toLowerCase() ===
              order.match_email.toLowerCase() &&
            item.amount === order.amount_net
          )
        }
        return false
      })

      if (candidates.length === 1) {
        claimed.add(candidates[0].id)
        await this.confirm(db, order, candidates[0].id)
      } else if (candidates.length > 1) {
        // More than one payment fits. Guessing here would hand goods to the
        // wrong buyer, so a human decides instead.
        await markAmbiguous(db, order.id)
      }
    }
  }

  private async confirm(
    db: D1Database,
    order: Order,
    transactionId: string
  ): Promise<void> {
    const transitioned = await markPaid(db, order.id, transactionId)
    if (!transitioned) return

    const fresh = await getOrder(db, order.id)
    if (fresh) await fulfil(db, fresh)
  }
}
