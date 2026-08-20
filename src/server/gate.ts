import { DurableObject } from "cloudflare:workers"
import { getMayarConfig } from "../lib/mayar/config"
import { getTransaction, listPaidBalanceHistory } from "../lib/mayar/operations"
import { fulfil } from "./fulfillment"
import {
  expireStale,
  getOrder,
  listPending,
  markAmbiguous,
  markPaid,
} from "./orders"
import { PAID_STATUSES } from "../lib/mayar/types"
import type { BalanceHistoryItem } from "../lib/mayar/types"
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

/**
 * How long to wait before confirming an order directly.
 *
 * The balance-history feed lags behind a transaction's own status, so a direct
 * check straight away would spend a request to learn what the next tick would
 * have told us for free.
 */
const DIRECT_CHECK_AFTER_MS = 15_000

/** Direct confirmations allowed per tick. Each costs one request. */
const MAX_DIRECT_CHECKS = 3

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

    const config = getMayarConfig()

    const budget = await this.acquire(1, RESERVED_FOR_USERS)
    if (!budget.granted) {
      // Out of headroom this minute. Try again on the next tick rather than
      // spending tokens a visitor needs to check out.
      return true
    }

    const page = await listPaidBalanceHistory(config)

    if (page.hasMore) {
      // Never silently truncate. If this appears, unsettled payments outgrew a
      // single page and the cursor has to be followed.
      console.warn(
        `reconcile: more than ${page.items.length} unsettled payments; ` +
          `cursor ${page.nextStartingAfter} not followed`
      )
    }

    await this.settle(db, pending, page.items)

    // The balance history lags: a transaction reads "paid" on its own endpoint
    // before its history row exists. Anything still waiting after that lag has
    // passed is confirmed directly, which is authoritative but costs a request
    // per order — hence the cap.
    const stillWaiting = (await listPending(db)).filter(
      (order) =>
        order.transaction_id !== null &&
        Date.now() - order.created_at > DIRECT_CHECK_AFTER_MS
    )

    for (const order of stillWaiting.slice(0, MAX_DIRECT_CHECKS)) {
      const slot = await this.acquire(1, RESERVED_FOR_USERS)
      if (!slot.granted) break
      try {
        const detail = await getTransaction(config, order.transaction_id!)
        if (detail.status === "paid") {
          await this.confirm(db, order, order.transaction_id!)
        }
      } catch (error) {
        console.error(`direct check failed for ${order.id}`, error)
      }
    }

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
    history: BalanceHistoryItem[]
  ): Promise<void> {
    // Rows that have not been paid yet must never satisfy a match.
    const paid = history.filter((item) => PAID_STATUSES.has(item.status))
    const claimed = new Set<string>()

    // Certain matches run first so a payment with a known transaction id can
    // never be stolen by a weaker amount or email match.
    //
    // The key is `paymentLinkTransactionId`, not `id`. A history row's own `id`
    // identifies the balance entry, and matching on it finds nothing.
    for (const order of pending) {
      if (!order.transaction_id) continue
      const hit = paid.find(
        (item) => item.paymentLinkTransactionId === order.transaction_id
      )
      if (hit) {
        claimed.add(hit.id)
        await this.confirm(db, order, order.transaction_id)
      }
    }

    for (const order of pending) {
      if (order.transaction_id) continue

      const candidates = paid.filter((item) => {
        if (claimed.has(item.id)) return false
        if (Math.abs(item.createdAt - order.created_at) > MATCH_WINDOW_MS)
          return false

        // The money field is `credit`. There is no `amount` on these rows.
        if (order.match_amount !== null)
          return item.credit === order.match_amount
        if (order.match_email !== null) {
          return (
            item.customer?.email.toLowerCase() ===
              order.match_email.toLowerCase() &&
            item.credit === order.amount_net
          )
        }
        return false
      })

      if (candidates.length === 1) {
        claimed.add(candidates[0].id)
        await this.confirm(
          db,
          order,
          candidates[0].paymentLinkTransactionId ?? candidates[0].id
        )
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
