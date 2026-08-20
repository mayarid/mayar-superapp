import { claimFulfillment, redeemCoupon } from "./orders"
import type { Order } from "./orders"

/**
 * Runs the fulfillment for a paid order.
 *
 * Every branch claims its work through `claimFulfillment`, which is guarded by
 * a unique index on (order_id, kind). Fulfilment is therefore at-most-once even
 * if the reconciler processes the same order twice.
 *
 * Returns the kinds that were performed on this call. An empty array means the
 * order was already fulfilled.
 */
export async function fulfil(db: D1Database, order: Order): Promise<string[]> {
  if (order.status !== "paid") return []

  const done: string[] = []

  // A redemption only counts once the money actually arrived, so an abandoned
  // checkout never consumes a coupon.
  if (order.coupon_code) {
    await redeemCoupon(db, order.id)
  }

  switch (order.model) {
    case "sekali-bayar": {
      if (
        await claimFulfillment(db, order.id, "receipt", {
          transactionId: order.transaction_id,
          net: order.amount_net,
        })
      ) {
        done.push("receipt")
      }
      break
    }

    default: {
      // Remaining models arrive in a later stage. Recording the receipt keeps
      // the order terminal rather than leaving it to be reprocessed forever.
      if (
        await claimFulfillment(db, order.id, "receipt", {
          transactionId: order.transaction_id,
          note: "model not yet implemented",
        })
      ) {
        done.push("receipt")
      }
      break
    }
  }

  return done
}
