import { describe, expect, it } from "vitest"
import { matchPayments } from "./matching"
import type { BalanceHistoryItem } from "../lib/mayar/types"
import type { Order } from "./orders"

const NOW = 1_787_200_000_000

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord_1",
    model: "sekali-bayar",
    status: "pending",
    product_id: "prod_1",
    mayar_id: null,
    transaction_id: null,
    match_email: null,
    match_amount: null,
    amount_gross: 2000,
    amount_discount: 1000,
    amount_net: 1000,
    coupon_code: null,
    buyer_name: "Uji",
    buyer_email: "uji@example.com",
    buyer_mobile: "0812",
    pay_url: null,
    created_at: NOW,
    expires_at: NOW + 1_800_000,
    paid_at: null,
    fulfilled_at: null,
    ...overrides,
  }
}

function history(
  overrides: Partial<BalanceHistoryItem> = {}
): BalanceHistoryItem {
  return {
    id: "hist_1",
    createdAt: NOW + 30_000,
    credit: 1000,
    status: "paid",
    paymentLinkTransactionId: null,
    paymentMethod: "QRIS",
    balanceHistoryType: "payment_request",
    customerId: "cust_1",
    customer: {
      id: "cust_1",
      email: "uji@example.com",
      name: "Uji",
      mobile: "0812",
    },
    xenditTransactionId: "xen_1",
    ...overrides,
  }
}

describe("matching by transaction id", () => {
  it("matches on paymentLinkTransactionId, not on the row's own id", () => {
    const decisions = matchPayments(
      [order({ transaction_id: "txn_1" })],
      [history({ id: "hist_1", paymentLinkTransactionId: "txn_1" })]
    )
    expect(decisions).toEqual([
      {
        orderId: "ord_1",
        outcome: "paid",
        transactionId: "txn_1",
        historyId: "hist_1",
      },
    ])
  })

  it("does not match when only the row id lines up", () => {
    // This was the real bug: matching item.id against the transaction id
    // silently found nothing and left paid orders hanging.
    const decisions = matchPayments(
      [order({ transaction_id: "txn_1" })],
      [history({ id: "txn_1", paymentLinkTransactionId: "something_else" })]
    )
    expect(decisions).toEqual([])
  })

  it("ignores rows that are not paid yet", () => {
    const decisions = matchPayments(
      [order({ transaction_id: "txn_1" })],
      [history({ paymentLinkTransactionId: "txn_1", status: "created" })]
    )
    expect(decisions).toEqual([])
  })

  it("accepts settled as paid, since money already moved", () => {
    const decisions = matchPayments(
      [order({ transaction_id: "txn_1" })],
      [history({ paymentLinkTransactionId: "txn_1", status: "settled" })]
    )
    expect(decisions[0]?.outcome).toBe("paid")
  })
})

describe("matching QRIS by unique amount", () => {
  const qris = order({ model: "qris", match_amount: 1347, amount_net: 1347 })

  it("matches on credit, because these rows carry no amount field", () => {
    const decisions = matchPayments([qris], [history({ credit: 1347 })])
    expect(decisions[0]).toMatchObject({ orderId: "ord_1", outcome: "paid" })
  })

  it("refuses a payment of a different amount", () => {
    expect(matchPayments([qris], [history({ credit: 1348 })])).toEqual([])
  })

  it("refuses a payment made before the order existed", () => {
    const decisions = matchPayments(
      [qris],
      [history({ credit: 1347, createdAt: NOW - 60_000 })]
    )
    expect(decisions).toEqual([])
  })

  it("refuses a payment outside the match window", () => {
    const decisions = matchPayments(
      [qris],
      [history({ credit: 1347, createdAt: NOW + 60 * 60 * 1000 })]
    )
    expect(decisions).toEqual([])
  })

  it("holds the order when two payments fit, rather than guessing", () => {
    const decisions = matchPayments(
      [qris],
      [
        history({ id: "hist_1", credit: 1347 }),
        history({ id: "hist_2", credit: 1347, createdAt: NOW + 40_000 }),
      ]
    )
    expect(decisions).toEqual([
      { orderId: "ord_1", outcome: "ambiguous", candidates: 2 },
    ])
  })
})

describe("matching credit by email", () => {
  const credit = order({
    model: "kredit",
    match_email: "Uji@Example.com",
    amount_net: 2000,
  })

  it("compares email case-insensitively and checks the amount too", () => {
    const decisions = matchPayments([credit], [history({ credit: 2000 })])
    expect(decisions[0]?.outcome).toBe("paid")
  })

  it("refuses the right buyer paying the wrong amount", () => {
    expect(matchPayments([credit], [history({ credit: 1500 })])).toEqual([])
  })

  it("refuses the right amount from a different buyer", () => {
    const other = history({
      credit: 2000,
      customer: {
        id: "c2",
        email: "lain@example.com",
        name: "Lain",
        mobile: "0813",
      },
    })
    expect(matchPayments([credit], [other])).toEqual([])
  })
})

describe("competition between orders", () => {
  it("lets a certain match win a payment a weaker one also fits", () => {
    const certain = order({ id: "ord_certain", transaction_id: "txn_1" })
    const guessing = order({
      id: "ord_qris",
      model: "qris",
      match_amount: 1000,
      transaction_id: null,
    })
    const row = history({
      id: "hist_1",
      paymentLinkTransactionId: "txn_1",
      credit: 1000,
    })

    const decisions = matchPayments([certain, guessing], [row])

    expect(decisions).toEqual([
      {
        orderId: "ord_certain",
        outcome: "paid",
        transactionId: "txn_1",
        historyId: "hist_1",
      },
    ])
  })

  it("never pays two orders from one payment", () => {
    const a = order({ id: "ord_a", model: "qris", match_amount: 1000 })
    const b = order({ id: "ord_b", model: "qris", match_amount: 1000 })
    const decisions = matchPayments([a, b], [history({ credit: 1000 })])

    // The first order takes the payment; the second finds nothing left and is
    // simply not settled. No payment is ever counted twice.
    const paid = decisions.filter((d) => d.outcome === "paid")
    expect(paid).toHaveLength(1)
  })
})

describe("empty inputs", () => {
  it("decides nothing when there is nothing waiting", () => {
    expect(matchPayments([], [history()])).toEqual([])
  })

  it("decides nothing when no payment has arrived", () => {
    expect(matchPayments([order({ transaction_id: "txn_1" })], [])).toEqual([])
  })
})
