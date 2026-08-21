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

/* -------------------------------------------------------------------------- */
/* Invoice — /hl/v2/invoices/create                                           */
/* -------------------------------------------------------------------------- */

export interface InvoiceItem {
  quantity: number
  /** Unit price. Must be positive: a discount cannot be a negative line. */
  rate: number
  description: string
}

export interface CreateInvoiceRequest {
  /** Customer full name. Unlike payments/create, this really is the buyer. */
  name: string
  email: string
  mobile: string
  items: InvoiceItem[]
  description?: string
  /** ISO 8601. */
  expiredAt?: string
  tax?: number
  paymentMethod?: string
  extraData?: Record<string, unknown>
}

export interface CreateInvoiceResponse {
  id: string
  transactionId: string
  link: string
  expiredAt: number
  extraData?: Record<string, unknown>
}

/* -------------------------------------------------------------------------- */
/* Dynamic QRIS — /hl/v2/qr-codes/create                                      */
/* -------------------------------------------------------------------------- */

/**
 * The entire request is one integer, and the response carries no identifier.
 * That is why the QRIS model reconciles on a unique amount: the amount is the
 * only thing that can tell two of these apart.
 */
export interface CreateQrCodeResponse {
  /** An image URL to render. Not an EMVCo payload string. */
  url: string
  amount: number
}

/* -------------------------------------------------------------------------- */
/* Installments — /hl/v2/installments/create                                  */
/* -------------------------------------------------------------------------- */

export interface InstallmentTerms {
  description: string
  interest: number
  /** Months. Documented minimum 3, maximum 24. */
  tenure: number
  /** Day of month the instalment falls due. Minimum 1, maximum 28. */
  dueDate: number
}

export interface CreateInstallmentRequest {
  name: string
  email: string
  mobile: string
  amount: number
  installment: InstallmentTerms
}

/**
 * One term of an instalment plan.
 *
 * Note what is *not* here. The response carries no per-term due date, so the
 * only due information is the plan-level `dueDate` day of month. And `id` is
 * the invoice's own id, not the payment-link transaction id — a paid term
 * appears in balance history under a different id entirely, so this cannot be
 * used to match a payment. See docs/api-findings.md.
 */
export interface InstallmentInvoice {
  id: string
  /** Term number, starting at 1. */
  index: number
  amount: number
  interestAmount: number
  /** Still owed after this term clears. */
  remainingAmount: number
  status: string
  /** A bare slug, unlike every other endpoint, which returns a full URL. */
  link: string
}

export interface CreateInstallmentResponse {
  id: string
  amount: number
  totalAmount: number
  totalInterest: number
  tenure: number
  dueDate: number
  status: string
  invoices: InstallmentInvoice[]
  createdAt: string
}

/* -------------------------------------------------------------------------- */
/* Membership — /hl/v2/memberships/*                                          */
/* -------------------------------------------------------------------------- */

export interface CustomerInfo {
  name: string
  email: string
  mobile: string
}

export interface RegisterMemberRequest {
  productId: string
  membershipTierId: string
  customerInfo: CustomerInfo
  /** Billing cycle in months. */
  membershipMonthlyPeriod: number
}

/**
 * The membership record, returned flat.
 *
 * There is no wrapper object around this. `mayarFetch` unwraps the envelope to
 * `data`, and `data` *is* the member — its own `id` alongside the human-facing
 * `memberId`. This once declared a `membershipCustomer` wrapper that the API
 * never sends, which made every membership checkout throw.
 */
export interface RegisterMemberResponse {
  /** Record id, used to reference the membership itself. */
  id: string
  /** Short human-facing code, e.g. "V67Q2PE2". This is what bills are raised against. */
  memberId: string
  customerId: string
  membershipTierId: string
  paymentLinkId: string
  status: string
  createdAt: string
  nextPayment: string | null
  expiredAt: string | null
  isLifetimePeriod: boolean | null
  customer: {
    id: string
    name: string
    email: string
    mobile: string
  }
}

/**
 * The invoice for one membership term.
 *
 * `amount` is computed from the tier. There is no parameter to override it, so
 * a coupon cannot be applied on this path. See docs/api-findings.md.
 */
export interface CreateMembershipInvoiceResponse {
  id: string
  name: string
  /**
   * The billing period this bill belongs to, as
   * `membershipInvoice:<id>:<month>:<year>`. This is what makes the endpoint
   * idempotent per term — asking again inside the same period returns the bill
   * already raised for it.
   */
  term: string
  membershipTierId: string
  amount: number
  status: string
  createdAt: string
  membershipBillUrl: string
  /**
   * No transaction id is returned. This once declared one, and because the
   * field was simply absent rather than wrong, the order was written with an
   * empty transaction id and could never be matched. The model is matched on
   * the buyer's email and the bill amount instead.
   */
}

/* -------------------------------------------------------------------------- */
/* Credit wallet — /hl/v2/credit/*                                            */
/* -------------------------------------------------------------------------- */

export interface CreditCheckoutRequest {
  productId: string
  customerInfo: CustomerInfo
  creditAmount: number
}

/**
 * Only a link comes back. No transaction id, which is why the credit model
 * reconciles on the buyer's email inside a time window.
 */
export interface CreditCheckoutResponse {
  checkoutLink: string
}

export interface CreditMutationRequest {
  customerId: string
  productId: string
  membershipTierId?: string
  amount: number
}

export interface CreditMutationResponse {
  customerNewBalance: number
}

/* -------------------------------------------------------------------------- */
/* Licences — /saas/v2/license/*                                              */
/* -------------------------------------------------------------------------- */

export interface LicenseRequest {
  licenseCode: string
  productId: string
}

/** These endpoints answer with a status and a message only. */
export interface LicenseResponse {
  status?: string
  message?: string
}

/**
 * A row from `GET /hl/v2/memberships/members`.
 *
 * The nested objects arrive **flattened into dotted keys** — `"customer.email"`
 * is a literal property name, not a `customer` object with an `email` field.
 * No other endpoint in this app does that.
 */
export interface MembershipMember {
  id: string
  /** A short human-readable code such as "FDWGFECK", not a UUID. */
  memberId: string
  customerId: string
  membershipTierId: string
  status: string
  nextPayment: string | null
  "customer.email"?: string
  "customer.name"?: string
  "customer.mobile"?: string
  "membershipTier.name"?: string
}
