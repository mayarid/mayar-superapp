/** Every amount in this app is an integer number of rupiah. Never a float. */
export type Rupiah = number

/** List price for every demo product. */
export const LIST_PRICE: Rupiah = 2000

/**
 * The lowest amount this app will ever charge. Demo prices sit at the list
 * price and coupons bring them here, never below.
 */
export const FLOOR_PRICE: Rupiah = 1000

export type DiscountType = "monetary" | "percentage"

export interface DiscountInput {
  gross: Rupiah
  discountType: DiscountType
  discountValue: number
}

export interface DiscountResult {
  gross: Rupiah
  discount: Rupiah
  net: Rupiah
  /** True when the discount was trimmed to keep `net` at the floor. */
  clamped: boolean
}

/**
 * Applies a Mayar coupon to a gross amount.
 *
 * Mayar validates a coupon but never applies one — no create endpoint accepts a
 * coupon code — so the arithmetic happens here and the reduced amount is what
 * Mayar is asked to charge. See docs/api-findings.md.
 */
export function applyDiscount({
  gross,
  discountType,
  discountValue,
}: DiscountInput): DiscountResult {
  const raw =
    discountType === "percentage"
      ? Math.round((gross * discountValue) / 100)
      : Math.round(discountValue)

  const maxDiscount = Math.max(0, gross - FLOOR_PRICE)
  const discount = Math.min(Math.max(raw, 0), maxDiscount)

  return {
    gross,
    discount,
    net: gross - discount,
    clamped: discount < raw,
  }
}

/**
 * Spreads a total discount across invoice line items by lowering each rate.
 *
 * Mayar rejects a negative `rate`, so a discount cannot be its own line on an
 * itemised invoice. Rates are reduced proportionally instead, and any rounding
 * remainder is taken off the largest line so the total lands exactly.
 */
export function spreadDiscountAcrossItems(
  rates: Array<{ quantity: number; rate: Rupiah }>,
  discount: Rupiah
): Rupiah[] {
  const gross = rates.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  if (gross <= 0 || discount <= 0) return rates.map((item) => item.rate)

  const reduced = rates.map((item) => {
    const share = (item.quantity * item.rate) / gross
    const off = Math.floor((discount * share) / item.quantity)
    return Math.max(1, item.rate - off)
  })

  // Rounding leaves a remainder. Take it off the largest line, never below 1.
  const achieved = rates.reduce(
    (sum, item, index) => sum + item.quantity * (item.rate - reduced[index]),
    0
  )
  const remainder = discount - achieved
  if (remainder > 0) {
    let largest = 0
    for (let i = 1; i < reduced.length; i++) {
      if (reduced[i] > reduced[largest]) largest = i
    }
    const perUnit = Math.floor(remainder / rates[largest].quantity)
    reduced[largest] = Math.max(1, reduced[largest] - perUnit)
  }

  return reduced
}

/**
 * Adds a Indonesian-style unique code to an amount.
 *
 * `qr-codes/create` accepts only an amount and returns no identifier, and the
 * transaction list cannot be filtered by amount. The amount itself is therefore
 * the only thing that can tell one QRIS payment from another, so a small random
 * suffix makes it a de facto order reference. Indonesian e-commerce has used
 * this pattern for years, so buyers already recognise it.
 */
export function withUniqueCode(amount: Rupiah): Rupiah {
  return amount + 1 + Math.floor(Math.random() * 999)
}

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatRupiah(amount: Rupiah): string {
  return RUPIAH.format(amount)
}
