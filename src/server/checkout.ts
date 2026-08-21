import {
  INSTALLMENT_DUE_DAY,
  INSTALLMENT_TENURE,
  INVOICE_ITEMS,
  TIERS,
} from "../lib/catalog"
import { absoluteMayarLink, MayarApiError } from "../lib/mayar/client"
import {
  createInstallment,
  createInvoice,
  createMembershipInvoice,
  createPayment,
  createQrCode,
  listMembers,
  registerMember,
} from "../lib/mayar/operations"
import { spreadDiscountAcrossItems, withUniqueCode } from "../lib/money"
import { attachMayarIds, createOrder, newOrderId } from "./orders"
import type { DemoProduct } from "../lib/catalog"
import type { MayarConfig } from "../lib/mayar/config"
import type { DiscountResult } from "../lib/money"

export interface Buyer {
  name: string
  email: string
  mobile: string
}

export interface CheckoutOutcome {
  orderId: string
  /** Hosted Mayar page. Absent for the QRIS model, which renders in place. */
  payUrl?: string
  /** QR image to render. Only the QRIS model returns one. */
  qrUrl?: string
  /** The amount actually charged, including any unique code. */
  charged: number
  /**
   * Instalment schedule, when the model has one.
   *
   * There is no per-term due date to report: the create response carries only
   * a plan-level day of month, so terms are identified by number instead.
   */
  schedule?: Array<{ amount: number; term: number; link: string }>
}

interface CheckoutInput {
  config: MayarConfig
  db: D1Database
  product: DemoProduct
  buyer: Buyer
  discount: DiscountResult
  couponCode: string | null
}

/**
 * Creates a checkout for any billing model.
 *
 * Every branch writes the order to D1 before calling Mayar, so a retry reuses
 * the same id and a create that fails halfway still leaves a record for the
 * reconciler to match against.
 *
 * What differs between branches is not just the endpoint but the *proof* it
 * leaves behind. Most return a transaction id. QRIS returns nothing at all, so
 * its order carries a unique amount instead.
 */
export async function createCheckout(
  input: CheckoutInput
): Promise<CheckoutOutcome> {
  const { config, db, product, buyer, discount, couponCode } = input
  const orderId = newOrderId()

  // The QRIS model has no identifier to match on, so the amount becomes the
  // identifier. Every other model is matched by its transaction id.
  const charged =
    product.model === "qris" ? withUniqueCode(discount.net) : discount.net

  // Matching keys for the models whose endpoints return no usable transaction
  // id. Every key an order carries has to hold, so more keys mean a narrower
  // match, never a looser one.
  //
  //  - qris   — no identifier of any kind, so the unique amount is the key.
  //  - kredit — a link and nothing else, so the buyer's email and the exact
  //             amount together stand in for one.
  //  - cicilan — the plan's terms carry their own invoice ids, but those are
  //             not the ids a paid term reports in balance history, so they
  //             cannot be matched on. Email plus the first term's amount is
  //             what is left. The amount is filled in after the plan exists,
  //             because only Mayar decides how the total splits.
  //  - membership — the bill returns no transaction id either, so it is
  //             matched the same way, on email plus the tier's amount.
  const matchesOnEmail =
    product.model === "kredit" ||
    product.model === "cicilan" ||
    product.model === "membership"

  await createOrder(db, {
    id: orderId,
    model: product.model,
    productId: product.productId,
    amountGross: discount.gross,
    amountDiscount: discount.discount,
    amountNet: charged,
    couponCode,
    buyerName: buyer.name,
    buyerEmail: buyer.email,
    buyerMobile: buyer.mobile,
    matchAmount:
      product.model === "qris" || product.model === "kredit" ? charged : null,
    matchEmail: matchesOnEmail ? buyer.email : null,
  })

  const meta = { orderId, model: product.model }

  switch (product.model) {
    case "qris": {
      const qr = await createQrCode(config, charged)
      await attachMayarIds(db, orderId, { payUrl: qr.url })
      return { orderId, qrUrl: qr.url, charged }
    }

    case "invoice": {
      // A discount cannot be its own line, so it is spread across the real
      // ones. See docs/api-findings.md.
      const rates = spreadDiscountAcrossItems(INVOICE_ITEMS, discount.discount)
      const items = INVOICE_ITEMS.map((item, index) => ({
        quantity: item.quantity,
        rate: rates[index],
        description: item.description,
      }))

      const invoice = await createInvoice(config, {
        ...buyer,
        items,
        description: `Pesanan ${orderId} — ${product.title}`,
        paymentMethod: "qris",
        extraData: meta,
      })
      await attachMayarIds(db, orderId, {
        mayarId: invoice.id,
        transactionId: invoice.transactionId,
        payUrl: invoice.link,
      })
      return { orderId, payUrl: invoice.link, charged }
    }

    case "cicilan": {
      const plan = await createInstallment(config, {
        ...buyer,
        amount: charged,
        installment: {
          description: `${product.title} — ${orderId}`,
          interest: 0,
          tenure: INSTALLMENT_TENURE,
          dueDate: INSTALLMENT_DUE_DAY,
        },
      })
      // Typed as a plain array, so an empty one has to be handled rather
      // than assumed away: without a first term there is nothing to pay.
      if (plan.invoices.length === 0) {
        throw new Error("Mayar tidak mengembalikan satu pun termin cicilan.")
      }
      // Instalment terms come back with `link` as a bare slug, unlike every
      // other endpoint, which returns an absolute URL.
      const firstTerm = plan.invoices[0]
      const first = absoluteMayarLink(firstTerm.link)
      // An instalment order is settled by its *first* term, not by the whole
      // plan. It cannot be otherwise: an order expires after ORDER_TTL_MS,
      // while the remaining terms fall due months later. So the amount to
      // watch for is one term's, not the total, and it is only known now
      // because Mayar decides how the total divides.
      await attachMayarIds(db, orderId, {
        mayarId: plan.id,
        payUrl: first,
        matchAmount: firstTerm.amount,
      })
      return {
        orderId,
        payUrl: first,
        charged,
        schedule: plan.invoices.map((invoice) => ({
          amount: invoice.amount,
          term: invoice.index,
          link: absoluteMayarLink(invoice.link),
        })),
      }
    }

    case "membership": {
      // An email may only be registered once per tier, so a returning buyer
      // has to be found instead of created. Renewing is the normal case for a
      // subscription, not an error.
      let memberId: string
      let memberRecordId: string
      try {
        const member = await registerMember(config, {
          productId: product.productId,
          membershipTierId: TIERS.membership,
          customerInfo: buyer,
          membershipMonthlyPeriod: 1,
        })
        memberId = member.memberId
        memberRecordId = member.id
      } catch (error) {
        if (!(error instanceof MayarApiError)) throw error
        const members = await listMembers(config, product.productId)
        const existing = members.items.find(
          (item) =>
            item["customer.email"]?.toLowerCase() === buyer.email.toLowerCase()
        )
        if (!existing) throw error
        memberId = existing.memberId
        memberRecordId = existing.id
      }

      // Idempotent per term: inside the same period this returns the existing
      // unpaid bill rather than raising a second one.
      const bill = await createMembershipInvoice(
        config,
        memberId,
        product.productId
      )
      // The bill carries no transaction id, so this model is matched like the
      // other identifier-less ones: the buyer's email set at creation, plus
      // the tier's own amount, which is authoritative over anything computed
      // here because the endpoint takes no amount override.
      await attachMayarIds(db, orderId, {
        mayarId: memberRecordId,
        payUrl: bill.membershipBillUrl,
        matchAmount: bill.amount,
      })
      return { orderId, payUrl: bill.membershipBillUrl, charged: bill.amount }
    }

    default: {
      // sekali-bayar and fulfillment share this path. They differ only in what
      // happens once the money arrives.
      const payment = await createPayment(config, {
        // The label is folded in because Mayar rejects a second create that
        // looks like the first, and two models share this endpoint at the
        // same price. Without it, trying both in a row returns
        // "Duplicate request detected".
        name: `${product.title} (${product.label})`,
        amount: charged,
        email: buyer.email,
        mobile: buyer.mobile,
        description: `Pesanan ${orderId} — ${product.title}`,
        paymentMethod: "qris",
        extraData: { ...meta, buyerName: buyer.name },
      })
      await attachMayarIds(db, orderId, {
        mayarId: payment.id,
        transactionId: payment.transactionId,
        payUrl: payment.link,
      })
      return { orderId, payUrl: payment.link, charged }
    }
  }
}
