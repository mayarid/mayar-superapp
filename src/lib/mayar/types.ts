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

export interface TransactionListItem {
  id: string
  createdAt: number
  type: string
  amount: number
  status: string
  paymentLinkId: string | null
  customerId: string | null
  customer: TransactionCustomer | null
}

export interface TransactionListResponse {
  data: TransactionListItem[]
  hasMore: boolean
  nextStartingAfter: string | null
}

/** Documented status values on a transaction. */
export type TransactionStatus = "created" | "unpaid" | "paid" | "expired"
