/**
 * Request and response shapes for the Mayar V2 endpoints this app calls.
 *
 * Every type here was written from the endpoint's own documentation page, read
 * on 2026-08-20, not from an older example. Where the live API differs from the
 * page, the difference is noted here and in docs/api-findings.md.
 */

import type { DiscountType } from "../money"

/* -------------------------------------------------------------------------- */
/* Coupons — /hl/v2/coupons/validate                                          */
/* -------------------------------------------------------------------------- */

export interface ValidateCouponRequest {
  couponCode: string
  /** Required. A coupon is always bound to a product. */
  paymentLinkId: string
  amount?: number
  customerEmail?: string
  membershipTierId?: string
  paymentLinkType?: string
}

export interface ValidateCouponResponse {
  valid: boolean
  coupon: {
    id: string
    code: string
    discountType: DiscountType
    discountValue: number
    minimumPurchase: number | null
    eligibleCustomerType: "all" | "new" | "old"
  }
}

/* -------------------------------------------------------------------------- */
/* Single payment request — /hl/v2/payments/create                            */
/* -------------------------------------------------------------------------- */

export interface CreatePaymentRequest {
  /** Title of the payment request, not the buyer's name. */
  name: string
  amount: number
  email?: string
  mobile?: string
  description?: string
  notes?: string
  /** ISO 8601. */
  expiredAt?: string
  /** Lowercase channel, e.g. "qris", "va/bni", "ewallet/gopay". */
  paymentMethod?: string
  extraData?: Record<string, unknown>
}

export interface CreatePaymentResponse {
  id: string
  transactionId: string
  link: string
}

/* -------------------------------------------------------------------------- */
/* Transactions — /hl/v2/transactions and /hl/v2/transactions/unpaid          */
/* -------------------------------------------------------------------------- */

export interface TransactionCustomer {
  id: string
  email: string
  name: string
  mobile: string
}

/**
 * A row from `GET /hl/v2/transactions`.
 *
 * Despite the path, this is a balance-history feed, not a list of the
 * transactions created by `payments/create` or `invoices/create`. Three
 * differences matter, and all three were found the hard way — by paying a real
 * invoice and watching the match fail. See docs/api-findings.md.
 *
 *  - `id` identifies the history row, NOT the transaction. The transaction id
 *    is `paymentLinkTransactionId`.
 *  - The money field is `credit`. There is no `amount`, and asking for one
 *    through `fields` does not produce it.
 *  - `paymentLinkId` is the internal link Mayar generated for the payment, not
 *    the product the checkout was for, so it cannot identify a demo product.
 */
export interface BalanceHistoryItem {
  id: string
  createdAt: number
  /** The amount, in rupiah. Named `credit`, not `amount`. */
  credit: number
  /** "paid" once the money arrives, later "settled". Both mean paid. */
  status: string
  /** The id returned by a create endpoint. This is the real match key. */
  paymentLinkTransactionId: string | null
  paymentMethod: string | null
  balanceHistoryType: string | null
  customerId: string | null
  customer: TransactionCustomer | null
  /** The gateway's own id. This is what the hosted thank-you page URL shows. */
  xenditTransactionId: string | null
}

/**
 * A row from `GET /hl/v2/transactions/unpaid`.
 *
 * This one is shaped as expected: `id` is the transaction id and `amount` is
 * present. The two list endpoints do not share a schema.
 */
export interface UnpaidTransactionItem {
  id: string
  createdAt: number
  amount: number
  /** "active" while awaiting payment, "expired" after. */
  status: string
  paymentLinkId: string | null
  customerId: string | null
  customer: TransactionCustomer | null
}

/** Balance-history statuses that mean the money has arrived. */
export const PAID_STATUSES = new Set(["paid", "settled"])

/**
 * `GET /hl/v2/transactions/{id}`, keyed by the id a create endpoint returned.
 *
 * This is the authoritative view of one transaction, and unlike the list it
 * does carry `amount` and a real transaction `status`.
 */
export interface TransactionDetail {
  id: string
  status: "created" | "unpaid" | "paid" | "expired" | string
  amount: number
  createdAt: number
  paymentLinkId: string | null
  customer?: TransactionCustomer | null
}
