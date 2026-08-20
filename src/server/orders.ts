import type { BillingModel } from "../lib/catalog"
import type { DiscountType, Rupiah } from "../lib/money"

export type OrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "expired"
  /** Heuristic matching found more than one candidate. Never auto-fulfilled. */
  | "ambiguous"

export interface Order {
  id: string
  model: BillingModel
  status: OrderStatus
  product_id: string | null
  mayar_id: string | null
  transaction_id: string | null
  match_email: string | null
  match_amount: number | null
  amount_gross: Rupiah
  amount_discount: Rupiah
  amount_net: Rupiah
  coupon_code: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_mobile: string | null
  pay_url: string | null
  created_at: number
  expires_at: number
  paid_at: number | null
  fulfilled_at: number | null
}

/** How long a checkout stays open before the reconciler sweeps it. */
export const ORDER_TTL_MS = 30 * 60 * 1000

export function newOrderId(): string {
  return `ord_${crypto.randomUUID()}`
}

export interface NewOrder {
  id: string
  model: BillingModel
  productId: string
  amountGross: Rupiah
  amountDiscount: Rupiah
  amountNet: Rupiah
  couponCode: string | null
  buyerName: string
  buyerEmail: string
  buyerMobile: string
  matchEmail?: string | null
  matchAmount?: number | null
}

/**
 * Writes the order before Mayar is called, so a retry reuses the same id and
 * a failed create still leaves a record to reconcile against.
 */
export async function createOrder(
  db: D1Database,
  order: NewOrder
): Promise<Order> {
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO orders (
         id, model, status, product_id, match_email, match_amount,
         amount_gross, amount_discount, amount_net, coupon_code,
         buyer_name, buyer_email, buyer_mobile, created_at, expires_at
       ) VALUES (?, ?, 'created', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      order.id,
      order.model,
      order.productId,
      order.matchEmail ?? null,
      order.matchAmount ?? null,
      order.amountGross,
      order.amountDiscount,
      order.amountNet,
      order.couponCode,
      order.buyerName,
      order.buyerEmail,
      order.buyerMobile,
      now,
      now + ORDER_TTL_MS
    )
    .run()

  return (await getOrder(db, order.id))!
}

export async function getOrder(
  db: D1Database,
  id: string
): Promise<Order | null> {
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first<Order>()
}

/** Records what Mayar returned once the checkout exists on their side. */
export async function attachMayarIds(
  db: D1Database,
  id: string,
  fields: { mayarId?: string; transactionId?: string; payUrl?: string }
): Promise<void> {
  await db
    .prepare(
      `UPDATE orders
          SET status = 'pending',
              mayar_id = COALESCE(?, mayar_id),
              transaction_id = COALESCE(?, transaction_id),
              pay_url = COALESCE(?, pay_url)
        WHERE id = ?`
    )
    .bind(
      fields.mayarId ?? null,
      fields.transactionId ?? null,
      fields.payUrl ?? null,
      id
    )
    .run()
}

/** Orders the reconciler still needs to watch. */
export async function listPending(
  db: D1Database,
  limit = 50
): Promise<Order[]> {
  const result = await db
    .prepare(
      `SELECT * FROM orders
        WHERE status IN ('created', 'pending') AND expires_at > ?
        ORDER BY created_at ASC
        LIMIT ?`
    )
    .bind(Date.now(), limit)
    .all<Order>()
  return result.results
}

export async function countPending(db: D1Database): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM orders
        WHERE status IN ('created', 'pending') AND expires_at > ?`
    )
    .bind(Date.now())
    .first<{ n: number }>()
  return row?.n ?? 0
}

/**
 * Marks an order paid. Guarded on the current status so that two reconciler
 * passes racing on the same order cannot both report a transition.
 */
export async function markPaid(
  db: D1Database,
  id: string,
  transactionId: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE orders
          SET status = 'paid', paid_at = ?, transaction_id = COALESCE(transaction_id, ?)
        WHERE id = ? AND status IN ('created', 'pending')`
    )
    .bind(Date.now(), transactionId, id)
    .run()
  return result.meta.changes > 0
}

/** Heuristic matching hit more than one candidate. Hold for a human. */
export async function markAmbiguous(db: D1Database, id: string): Promise<void> {
  await db
    .prepare(
      `UPDATE orders SET status = 'ambiguous'
        WHERE id = ? AND status IN ('created', 'pending')`
    )
    .bind(id)
    .run()
}

export async function expireStale(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `UPDATE orders SET status = 'expired'
        WHERE status IN ('created', 'pending') AND expires_at <= ?`
    )
    .bind(Date.now())
    .run()
  return result.meta.changes
}

/* -------------------------------------------------------------------------- */
/* Coupon ledger                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Mayar validates a coupon but never consumes one, so redemptions are counted
 * here. A row is written when the coupon is applied and only marked redeemed
 * once the order is paid, so an abandoned checkout never burns a redemption.
 */
export async function recordCouponApplied(
  db: D1Database,
  input: {
    orderId: string
    couponCode: string
    productId: string
    discountType: DiscountType
    discountValue: number
    appliedAmount: Rupiah
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO coupon_usage
         (coupon_code, order_id, product_id, discount_type, discount_value, applied_amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.couponCode,
      input.orderId,
      input.productId,
      input.discountType,
      input.discountValue,
      input.appliedAmount,
      Date.now()
    )
    .run()
}

export async function redeemCoupon(
  db: D1Database,
  orderId: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE coupon_usage SET redeemed_at = ?
        WHERE order_id = ? AND redeemed_at IS NULL`
    )
    .bind(Date.now(), orderId)
    .run()
}

export async function countRedemptions(
  db: D1Database,
  couponCode: string
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM coupon_usage
        WHERE coupon_code = ? AND redeemed_at IS NOT NULL`
    )
    .bind(couponCode)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/* -------------------------------------------------------------------------- */
/* Fulfillment log                                                            */
/* -------------------------------------------------------------------------- */

export type FulfillmentKind =
  | "receipt"
  | "r2_grant"
  | "membership_register"
  | "credit_add"
  | "license_issue"
  | "schedule"

/**
 * Claims the right to fulfil an order once.
 *
 * Returns false when the claim already exists. The uniqueness is enforced by a
 * database index rather than by a read-then-write, so two concurrent callers
 * cannot both win.
 */
export async function claimFulfillment(
  db: D1Database,
  orderId: string,
  kind: FulfillmentKind,
  detail: unknown = null
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO fulfillments (order_id, kind, detail, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(
      orderId,
      kind,
      detail === null ? null : JSON.stringify(detail),
      Date.now()
    )
    .run()

  const claimed = result.meta.changes > 0
  if (claimed) {
    await db
      .prepare(
        `UPDATE orders SET fulfilled_at = ? WHERE id = ? AND fulfilled_at IS NULL`
      )
      .bind(Date.now(), orderId)
      .run()
  }
  return claimed
}

export async function listFulfillments(
  db: D1Database,
  orderId: string
): Promise<
  Array<{ kind: FulfillmentKind; detail: string | null; created_at: number }>
> {
  const result = await db
    .prepare(
      `SELECT kind, detail, created_at FROM fulfillments WHERE order_id = ? ORDER BY id`
    )
    .bind(orderId)
    .all<{ kind: FulfillmentKind; detail: string | null; created_at: number }>()
  return result.results
}
