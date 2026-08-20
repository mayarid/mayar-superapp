import { describe, expect, it } from "vitest"
import {
  applyDiscount,
  FLOOR_PRICE,
  formatRupiah,
  spreadDiscountAcrossItems,
  withUniqueCode,
} from "./money"

describe("applyDiscount", () => {
  it("takes a percentage off the gross", () => {
    expect(
      applyDiscount({
        gross: 2000,
        discountType: "percentage",
        discountValue: 50,
      })
    ).toEqual({ gross: 2000, discount: 1000, net: 1000, clamped: false })
  })

  it("takes a fixed amount off the gross", () => {
    expect(
      applyDiscount({
        gross: 2000,
        discountType: "monetary",
        discountValue: 1000,
      })
    ).toEqual({ gross: 2000, discount: 1000, net: 1000, clamped: false })
  })

  it("never charges below the floor, and says when it trimmed", () => {
    const result = applyDiscount({
      gross: 2000,
      discountType: "monetary",
      discountValue: 5000,
    })
    expect(result.net).toBe(FLOOR_PRICE)
    expect(result.discount).toBe(1000)
    expect(result.clamped).toBe(true)
  })

  it("clamps a 100 percent coupon to the floor too", () => {
    const result = applyDiscount({
      gross: 6000,
      discountType: "percentage",
      discountValue: 100,
    })
    expect(result.net).toBe(FLOOR_PRICE)
    expect(result.clamped).toBe(true)
  })

  it("treats a negative coupon value as no discount", () => {
    const result = applyDiscount({
      gross: 2000,
      discountType: "monetary",
      discountValue: -500,
    })
    expect(result.discount).toBe(0)
    expect(result.net).toBe(2000)
  })

  it("rounds a percentage to whole rupiah", () => {
    // 33% of 1001 is 330.33, and a fractional rupiah cannot be charged.
    const result = applyDiscount({
      gross: 1001,
      discountType: "percentage",
      discountValue: 33,
    })
    expect(Number.isInteger(result.discount)).toBe(true)
    expect(Number.isInteger(result.net)).toBe(true)
  })
})

describe("spreadDiscountAcrossItems", () => {
  // Mayar rejects a negative rate, so a discount has to be pushed into the
  // real lines. Getting this wrong overcharges or undercharges silently.
  const items = [
    { quantity: 1, rate: 1000 },
    { quantity: 1, rate: 700 },
    { quantity: 1, rate: 300 },
  ]

  it("removes exactly the discount asked for", () => {
    const rates = spreadDiscountAcrossItems(items, 1000)
    const total = items.reduce(
      (sum, item, index) => sum + item.quantity * rates[index],
      0
    )
    expect(total).toBe(1000)
  })

  it("keeps every rate positive, because Mayar rejects anything else", () => {
    const rates = spreadDiscountAcrossItems(items, 1999)
    for (const rate of rates) expect(rate).toBeGreaterThan(0)
  })

  it("leaves rates untouched when there is no discount", () => {
    expect(spreadDiscountAcrossItems(items, 0)).toEqual([1000, 700, 300])
  })

  it("returns whole rupiah only", () => {
    const rates = spreadDiscountAcrossItems(items, 777)
    for (const rate of rates) expect(Number.isInteger(rate)).toBe(true)
  })

  it("handles a single line", () => {
    const rates = spreadDiscountAcrossItems([{ quantity: 2, rate: 1000 }], 1000)
    expect(rates[0] * 2).toBe(1000)
  })
})

describe("withUniqueCode", () => {
  it("only ever adds, so the charge never drops below the base", () => {
    for (let i = 0; i < 200; i++) {
      const amount = withUniqueCode(1000)
      expect(amount).toBeGreaterThan(1000)
      expect(amount).toBeLessThanOrEqual(1999)
    }
  })

  it("produces a spread of values, which is the whole point", () => {
    const seen = new Set<number>()
    for (let i = 0; i < 200; i++) seen.add(withUniqueCode(1000))
    // Two orders of the same price must be distinguishable most of the time.
    expect(seen.size).toBeGreaterThan(50)
  })
})

describe("formatRupiah", () => {
  it("writes whole rupiah with no decimals", () => {
    expect(formatRupiah(1000)).toMatch(/1\.000/)
    expect(formatRupiah(1000)).not.toMatch(/,00/)
  })
})
