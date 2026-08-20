import { mayarFetch, mayarFetchPage } from "./client"
import type { MayarPage } from "./client"
import type { MayarConfig } from "./config"
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  TransactionListItem,
  ValidateCouponRequest,
  ValidateCouponResponse,
} from "./types"

/** Mayar allows at most 50 results per page. */
export const MAX_PAGE = 50

function body(payload: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(payload) }
}

/**
 * Checks a coupon against a product.
 *
 * Returns the discount terms, never the discounted price — the arithmetic is
 * ours. This call does not consume the coupon, so Mayar's own usage counter
 * never moves and limits must be enforced locally.
 *
 * A coupon that exists but is bound to a different product returns 404 with the
 * same message as a coupon that does not exist, so callers cannot tell the two
 * apart and must not claim to.
 */
export function validateCoupon(
  config: MayarConfig,
  payload: ValidateCouponRequest
): Promise<ValidateCouponResponse> {
  return mayarFetch<ValidateCouponResponse>(
    config,
    "/hl/v2/coupons/validate",
    body(payload)
  )
}

/**
 * Creates a single payment request and returns its hosted link.
 *
 * This endpoint accepts buyer fields and a per-checkout amount, which is why it
 * carries the discounted total. It has no `redirectUrl`, so the buyer is not
 * returned to this app automatically after paying.
 */
export function createPayment(
  config: MayarConfig,
  payload: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  return mayarFetch<CreatePaymentResponse>(
    config,
    "/hl/v2/payments/create",
    body(payload)
  )
}

interface TransactionQuery {
  startAt?: number
  endAt?: number
  limit?: number
  startingAfter?: string
  status?: string
}

function toQuery(query: TransactionQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ""
}

/**
 * Lists paid transactions in a time window.
 *
 * The API has no amount filter, so matching a payment to an order by amount
 * means fetching the window and comparing here.
 */
export function listPaidTransactions(
  config: MayarConfig,
  query: TransactionQuery = {}
): Promise<MayarPage<TransactionListItem>> {
  return mayarFetchPage<TransactionListItem>(
    config,
    `/hl/v2/transactions${toQuery({ limit: MAX_PAGE, ...query })}`
  )
}

/** Lists transactions that exist but are not yet paid. */
export function listUnpaidTransactions(
  config: MayarConfig,
  query: TransactionQuery = {}
): Promise<MayarPage<TransactionListItem>> {
  return mayarFetchPage<TransactionListItem>(
    config,
    `/hl/v2/transactions/unpaid${toQuery({ limit: MAX_PAGE, ...query })}`
  )
}
