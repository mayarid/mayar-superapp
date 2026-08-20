import { claimFulfillment, redeemCoupon } from "./orders"
import type { Order } from "./orders"

/** R2 key holding the file the fulfillment model delivers. */
export const DELIVERABLE_KEY = "deliverables/paket-ikon-antarmuka.zip"

/** How long a download grant stays usable. */
export const GRANT_TTL_MS = 15 * 60 * 1000

/**
 * Runs the fulfillment for a paid order.
 *
 * Every branch claims its work through `claimFulfillment`, which is guarded by
 * a unique index on (order_id, kind). Fulfilment is therefore at-most-once even
 * if the reconciler processes the same order twice, and that guarantee lives in
 * the database rather than in this function.
 *
 * Returns the kinds performed on this call. An empty array means the order was
 * already fulfilled.
 */
export async function fulfil(db: D1Database, order: Order): Promise<string[]> {
  if (order.status !== "paid") return []

  const done: string[] = []

  // A redemption only counts once the money actually arrived, so an abandoned
  // checkout never consumes a coupon.
  if (order.coupon_code) {
    await redeemCoupon(db, order.id)
  }

  const claim = async (
    kind: Parameters<typeof claimFulfillment>[2],
    detail: unknown
  ) => {
    if (await claimFulfillment(db, order.id, kind, detail)) done.push(kind)
  }

  const base = {
    transactionId: order.transaction_id,
    charged: order.amount_net,
  }

  switch (order.model) {
    case "fulfillment":
      // The grant is recorded here; the signed URL is minted on request so it
      // is always fresh, and expires whether or not the buyer used it.
      await claim("r2_grant", {
        ...base,
        key: DELIVERABLE_KEY,
        expiresInMs: GRANT_TTL_MS,
      })
      break

    case "membership":
      // Mayar already holds the membership record. Nothing is provisioned
      // here, which is the point: the entitlement lives in Mayar, not in D1.
      await claim("membership_register", { ...base, mayarId: order.mayar_id })
      break

    case "cicilan":
      await claim("schedule", { ...base, installmentId: order.mayar_id })
      break

    case "saas":
      // The licence code's origin is undocumented. The page looks for it and
      // says so plainly when it cannot be found, rather than inventing one.
      await claim("license_issue", { ...base, productId: order.product_id })
      break

    case "kredit":
      await claim("credit_add", { ...base, productId: order.product_id })
      break

    default:
      await claim("receipt", base)
      break
  }

  // Every paid order gets a receipt, including the ones above.
  if (order.model !== "sekali-bayar" && order.model !== "qris") {
    await claim("receipt", base)
  }

  return done
}
