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
  /** Instalment schedule, when the model has one. */
  schedule?: Array<{ amount: number; dueDate: number; link: string }>
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
    matchAmount: product.model === "qris" ? charged : null,
    matchEmail: product.model === "kredit" ? buyer.email : null,
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
      const first = absoluteMayarLink(plan.invoices[0].link)
      await attachMayarIds(db, orderId, { mayarId: plan.id, payUrl: first })
      return {
        orderId,
        payUrl: first,
        charged,
        schedule: plan.invoices.map((invoice) => ({
          amount: invoice.amount,
          dueDate: invoice.dueDate,
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
        memberId = member.membershipCustomer.memberId
        memberRecordId = member.membershipCustomer.id
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
      await attachMayarIds(db, orderId, {
        mayarId: memberRecordId,
        transactionId: bill.transactionId,
        payUrl: bill.membershipBillUrl,
      })
      return { orderId, payUrl: bill.membershipBillUrl, charged: bill.amount }
    }

    default: {
      // sekali-bayar and fulfillment share this path. They differ only in what
      // happens once the money arrives.
      const payment = await createPayment(config, {
        name: product.title,
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
