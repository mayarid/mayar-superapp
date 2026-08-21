import { PAID_STATUSES } from "../lib/mayar/types"
import type { BalanceHistoryItem } from "../lib/mayar/types"
import type { Order } from "./orders"

/** How far apart an order and its payment may be and still be considered a pair. */
export const MATCH_WINDOW_MS = 45 * 60 * 1000

export type MatchDecision =
  | {
      orderId: string
      outcome: "paid"
      transactionId: string
      historyId: string
    }
  | { orderId: string; outcome: "ambiguous"; candidates: number }

/**
 * Decides which paid payments belong to which waiting orders.
 *
 * Pure on purpose. This is the highest-consequence logic in the application —
 * getting it wrong either withholds goods that were paid for or hands them to
 * the wrong buyer — and welded inside a Durable Object it could only be
 * exercised by making real payments. Here it can be tested directly.
 *
 * Proof strength is not uniform:
 *
 *  - An order created through an endpoint that returned a transaction id is
 *    matched on `paymentLinkTransactionId`. That is certain.
 *  - QRIS returns no identifier at all, so its order is matched on an amount
 *    made unique at checkout.
 *  - Credit returns only a link, so its order is matched on the buyer's email
 *    together with the exact amount.
 *  - Instalments do return per-term invoice ids, but a paid term reports a
 *    different id in balance history, so those ids are useless here. Such an
 *    order is matched on the buyer's email and the first term's amount.
 *
 * Every heuristic fails closed. An order is settled only when exactly one
 * payment fits it, a payment already claimed by a stronger match can never be
 * taken by a weaker one, and an order carrying no key at all never matches.
 */
export function matchPayments(
  pending: Order[],
  history: BalanceHistoryItem[]
): MatchDecision[] {
  // A row that has not been paid must never satisfy a match.
  const paid = history.filter((item) => PAID_STATUSES.has(item.status))
  const claimed = new Set<string>()
  const decisions: MatchDecision[] = []

  // Certain matches run first, so a payment with a known transaction id cannot
  // be stolen by an amount or email that happens to line up.
  for (const order of pending) {
    if (!order.transaction_id) continue
    const hit = paid.find(
      (item) => item.paymentLinkTransactionId === order.transaction_id
    )
    if (hit) {
      claimed.add(hit.id)
      decisions.push({
        orderId: order.id,
        outcome: "paid",
        transactionId: order.transaction_id,
        historyId: hit.id,
      })
    }
  }

  for (const order of pending) {
    if (order.transaction_id) continue

    const candidates = paid.filter((item) => {
      if (claimed.has(item.id)) return false
      if (Math.abs(item.createdAt - order.created_at) > MATCH_WINDOW_MS) {
        return false
      }
      // Nothing older than the order can have paid for it.
      if (item.createdAt < order.created_at) return false

      // An order with no key at all must never match. Without one there is
      // nothing distinguishing it from every other order of the same price,
      // and settling it would be a guess wearing the clothes of a match.
      if (order.match_amount === null && order.match_email === null) {
        return false
      }

      // Every key the order carries has to hold. Keys narrow a match, never
      // widen it, so an order with two is harder to satisfy than one with one.
      //
      // The money field on these rows is `credit`. There is no `amount`.
      if (order.match_amount !== null && item.credit !== order.match_amount) {
        return false
      }
      if (
        order.match_email !== null &&
        item.customer?.email.toLowerCase() !== order.match_email.toLowerCase()
      ) {
        return false
      }
      return true
    })

    if (candidates.length === 1) {
      const hit = candidates[0]
      claimed.add(hit.id)
      decisions.push({
        orderId: order.id,
        outcome: "paid",
        transactionId: hit.paymentLinkTransactionId ?? hit.id,
        historyId: hit.id,
      })
    } else if (candidates.length > 1) {
      // More than one payment fits. Guessing here would hand goods to the
      // wrong buyer, so a human decides instead.
      decisions.push({
        orderId: order.id,
        outcome: "ambiguous",
        candidates: candidates.length,
      })
    }
  }

  return decisions
}
