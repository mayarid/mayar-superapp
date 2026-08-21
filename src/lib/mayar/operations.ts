import { mayarFetch, mayarFetchPage } from "./client"
import type { MayarPage } from "./client"
import type { MayarConfig } from "./config"
import type {
  BalanceHistoryItem,
  CreateInstallmentRequest,
  CreateInstallmentResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CreateMembershipInvoiceResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreateQrCodeResponse,
  CreditCheckoutRequest,
  CreditCheckoutResponse,
  CreditMutationRequest,
  CreditMutationResponse,
  LicenseRequest,
  LicenseResponse,
  MembershipMember,
  RegisterMemberRequest,
  RegisterMemberResponse,
  TransactionDetail,
  UnpaidTransactionItem,
  ValidateCouponRequest,
  ValidateCouponResponse,
} from "./types"

/** Mayar allows at most 50 results per page. */
export const MAX_PAGE = 50

/**
 * Page size for the balance history, which must stay below `MAX_PAGE`.
 *
 * `GET /hl/v2/transactions` returns a stale, truncated page once the limit
 * reaches fifty. Measured on one account within seconds of each other:
 *
 *     limit=10  -> 10 rows, newest payment present, hasMore true
 *     limit=40  -> 40 rows, newest payment present, hasMore true
 *     limit=50  -> 43 rows, newest two payments MISSING, hasMore false
 *     limit=100 -> 43 rows, same stale page
 *
 * A bigger limit bought fewer and older rows. Because `MAX_PAGE` is fifty, the
 * reconciler was asking for exactly the value that made it blind to every
 * payment it was waiting for. Forty is the largest limit still returning a
 * fresh page. See docs/api-findings.md.
 */
export const BALANCE_PAGE = 40

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

function toQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ""
}

/**
 * Reads balance-history rows for payments that have arrived but not settled.
 *
 * `GET /hl/v2/transactions` returns balance-history rows, not transactions.
 * A row's `paymentLinkTransactionId` matches an id from a create endpoint, and
 * its money field is `credit`.
 *
 * No `status` filter is sent, and that is deliberate. `status=paid` drops rows
 * whose own `status` field reads `"paid"` — a `membership_payment` row was
 * absent from the filtered page for minutes while sitting at the top of the
 * unfiltered one. Filtering here would therefore hide exactly the payments the
 * reconciler exists to find. Callers filter on `PAID_STATUSES` instead, which
 * reads the field rather than trusting the query, and in practice the page
 * comes back entirely paid anyway.
 *
 * `startAt` and `endAt` are accepted and ignored, so they cannot narrow the
 * page either. The limit is `BALANCE_PAGE`, not `MAX_PAGE`, and that
 * difference is load bearing — see the constant.
 */
export function listPaidBalanceHistory(
  config: MayarConfig
): Promise<MayarPage<BalanceHistoryItem>> {
  return mayarFetchPage<BalanceHistoryItem>(
    config,
    `/hl/v2/transactions${toQuery({ limit: BALANCE_PAGE })}`
  )
}

/** Lists transactions that exist but are not yet paid. Shaped differently. */
export function listUnpaidTransactions(
  config: MayarConfig,
  query: TransactionQuery = {}
): Promise<MayarPage<UnpaidTransactionItem>> {
  return mayarFetchPage<UnpaidTransactionItem>(
    config,
    `/hl/v2/transactions/unpaid${toQuery({ limit: MAX_PAGE, ...query })}`
  )
}

/**
 * Reads one transaction by the id a create endpoint returned.
 *
 * Unlike the list, this is authoritative and returns `status` and `amount`
 * directly. It costs one request per order, so it is used to confirm a single
 * order rather than to sweep for many.
 */
export function getTransaction(
  config: MayarConfig,
  transactionId: string
): Promise<TransactionDetail> {
  return mayarFetch<TransactionDetail>(
    config,
    `/hl/v2/transactions/${transactionId}`
  )
}

/**
 * Creates an itemised invoice.
 *
 * A discount reaches this endpoint as lowered line rates, never as its own
 * line: `items[].rate` must be positive. The buyer therefore does not see the
 * discount broken out on Mayar's hosted invoice.
 */
export function createInvoice(
  config: MayarConfig,
  payload: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  return mayarFetch<CreateInvoiceResponse>(
    config,
    "/hl/v2/invoices/create",
    body(payload)
  )
}

/**
 * Creates a dynamic QRIS code for one amount.
 *
 * The request is the amount and nothing else, and the response has no
 * identifier to poll. Give it an amount made unique by the caller, or the
 * payment cannot be told from any other of the same value.
 */
export function createQrCode(
  config: MayarConfig,
  amount: number
): Promise<CreateQrCodeResponse> {
  return mayarFetch<CreateQrCodeResponse>(
    config,
    "/hl/v2/qr-codes/create",
    body({ amount })
  )
}

/** Creates an instalment plan. Tenure must be 3 to 24 months. */
export function createInstallment(
  config: MayarConfig,
  payload: CreateInstallmentRequest
): Promise<CreateInstallmentResponse> {
  return mayarFetch<CreateInstallmentResponse>(
    config,
    "/hl/v2/installments/create",
    body(payload)
  )
}

/** Registers a member. This creates the membership record, not a payable bill. */
export function registerMember(
  config: MayarConfig,
  payload: RegisterMemberRequest
): Promise<RegisterMemberResponse> {
  return mayarFetch<RegisterMemberResponse>(
    config,
    "/hl/v2/memberships/members/create",
    body(payload)
  )
}

/**
 * Raises the bill for one membership term.
 *
 * Idempotent per billing term: calling it again inside the same period returns
 * the existing unpaid invoice rather than a second one. The amount comes from
 * the tier and cannot be overridden, so no coupon applies here.
 */
export function createMembershipInvoice(
  config: MayarConfig,
  memberId: string,
  productId: string
): Promise<CreateMembershipInvoiceResponse> {
  return mayarFetch<CreateMembershipInvoiceResponse>(
    config,
    `/hl/v2/memberships/members/${memberId}/invoice/create`,
    body({ productId })
  )
}

/**
 * Builds a checkout link for a credit top-up.
 *
 * Customer details are embedded in an HMAC-signed token, so the link cannot be
 * edited after it is made. No transaction id comes back, which is why this
 * model reconciles on the buyer's email.
 */
export function createCreditCheckout(
  config: MayarConfig,
  payload: CreditCheckoutRequest
): Promise<CreditCheckoutResponse> {
  return mayarFetch<CreditCheckoutResponse>(
    config,
    "/hl/v2/credit/generate/immutable/checkout",
    body(payload)
  )
}

/** Adds wallet units to a customer. */
export function addCredit(
  config: MayarConfig,
  payload: CreditMutationRequest
): Promise<CreditMutationResponse> {
  return mayarFetch<CreditMutationResponse>(
    config,
    "/hl/v2/credit/customer/add-credit",
    body(payload)
  )
}

/** Consumes wallet units. This is the call a metered feature would make. */
export function spendCredit(
  config: MayarConfig,
  payload: CreditMutationRequest
): Promise<CreditMutationResponse> {
  return mayarFetch<CreditMutationResponse>(
    config,
    "/hl/v2/credit/spend",
    body(payload)
  )
}

/** Reads a customer's remaining wallet balance. */
export function getCreditBalance(
  config: MayarConfig,
  query: { customerId: string; productId: string; membershipTierId?: string }
): Promise<CreditMutationResponse> {
  return mayarFetch<CreditMutationResponse>(
    config,
    `/hl/v2/credit/balance${toQuery(query)}`
  )
}

/**
 * Licence operations.
 *
 * These live under `/saas/v2`, the only endpoints in this app that do not use
 * the `/hl/v2` prefix.
 */
export function activateLicense(
  config: MayarConfig,
  payload: LicenseRequest
): Promise<LicenseResponse> {
  return mayarFetch<LicenseResponse>(
    config,
    "/saas/v2/license/activate",
    body(payload)
  )
}

export function verifyLicense(
  config: MayarConfig,
  payload: LicenseRequest
): Promise<LicenseResponse> {
  return mayarFetch<LicenseResponse>(
    config,
    "/saas/v2/license/verify",
    body(payload)
  )
}

/**
 * Lists the members of a membership product.
 *
 * Needed because `memberships/members/create` refuses an email already
 * registered on the tier. A returning buyer has to be found rather than
 * created again.
 */
export function listMembers(
  config: MayarConfig,
  productId: string
): Promise<MayarPage<MembershipMember>> {
  return mayarFetchPage<MembershipMember>(
    config,
    `/hl/v2/memberships/members${toQuery({ productId, limit: MAX_PAGE })}`
  )
}
