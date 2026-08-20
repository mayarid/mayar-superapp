import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { findByModel } from "@/lib/catalog"
import { MayarApiError } from "@/lib/mayar/client"
import { getMayarConfig } from "@/lib/mayar/config"
import { validateCoupon } from "@/lib/mayar/operations"
import { applyDiscount } from "@/lib/money"
import { createCheckout } from "@/server/checkout"
import { recordCouponApplied } from "@/server/orders"
import type { DiscountResult, DiscountType } from "@/lib/money"

/** Redemptions allowed per coupon code, enforced here because Mayar does not. */
const COUPON_LIMIT = 200

interface CheckoutBody {
  model?: string
  name?: string
  email?: string
  mobile?: string
  couponCode?: string | null
}

function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: CheckoutBody
        try {
          payload = await request.json<CheckoutBody>()
        } catch {
          return bad("Badan permintaan bukan JSON yang sah.")
        }

        const product = findByModel(payload.model)
        if (!product) return bad("Model billing tidak dikenal.")
        if (product.blocked) return bad(product.blocked, 503)

        const name = payload.name?.trim() ?? ""
        const email = payload.email?.trim().toLowerCase() ?? ""
        const mobile = payload.mobile?.trim() ?? ""

        if (name.length < 2) return bad("Nama wajib diisi.")
        if (!EMAIL.test(email)) return bad("Email tidak sah.")
        if (mobile.replace(/\D/g, "").length < 8)
          return bad("Nomor telepon tidak sah.")

        // Counted only once the request is well-formed enough to reach Mayar.
        // The limit exists to protect the shared Mayar budget, and a request
        // rejected above never touches it, so charging it a slot would punish
        // a typo as harshly as abuse.
        const ip = request.headers.get("CF-Connecting-IP") ?? "local"
        const verdict = await env.RATE_LIMITER.getByName(ip).take()
        if (!verdict.allowed) {
          return Response.json(
            {
              error: `Terlalu banyak percobaan checkout. Coba lagi dalam ${verdict.retryAfterSeconds} detik.`,
            },
            {
              status: 429,
              headers: { "Retry-After": String(verdict.retryAfterSeconds) },
            }
          )
        }

        const config = getMayarConfig()
        const gate = env.MAYAR_GATE.getByName("global")

        // The price comes from the server catalog. A client-supplied amount is
        // never trusted, so a tampered request cannot lower the charge.
        const gross = product.price
        let discount: DiscountResult = {
          gross,
          discount: 0,
          net: gross,
          clamped: false,
        }
        let couponCode: string | null = null
        let couponTerms: {
          discountType: DiscountType
          discountValue: number
        } | null = null

        const requested = payload.couponCode?.trim().toUpperCase()
        if (requested) {
          if (product.couponBlocked) return bad(product.couponBlocked.reason)
          if (!product.coupons.includes(requested)) {
            return bad("Kode diskon tidak berlaku untuk produk ini.")
          }

          // Mayar never counts a redemption, so the local ledger is the only
          // thing standing between a demo coupon and unlimited use.
          const used = await env.DB.prepare(
            `SELECT COUNT(*) AS n FROM coupon_usage WHERE coupon_code = ? AND redeemed_at IS NOT NULL`
          )
            .bind(requested)
            .first<{ n: number }>()
          if ((used?.n ?? 0) >= COUPON_LIMIT) {
            return bad("Kuota kode diskon ini sudah habis.")
          }

          const budget = await gate.acquire(1)
          if (!budget.granted) {
            return bad("Demo sedang sibuk. Coba lagi sebentar lagi.", 503)
          }

          try {
            const result = await validateCoupon(config, {
              couponCode: requested,
              paymentLinkId: product.productId,
              amount: gross,
              customerEmail: email,
            })
            if (!result.valid) return bad("Kode diskon tidak berlaku.")

            couponCode = result.coupon.code
            couponTerms = {
              discountType: result.coupon.discountType,
              discountValue: result.coupon.discountValue,
            }
            discount = applyDiscount({
              gross,
              discountType: result.coupon.discountType,
              discountValue: result.coupon.discountValue,
            })
          } catch (error) {
            if (error instanceof MayarApiError && error.statusCode === 404) {
              // Mayar answers "not found" both for an unknown code and for a
              // code bound to another product, so neither can be claimed.
              return bad(
                "Kode diskon tidak ditemukan atau tidak berlaku di sini."
              )
            }
            throw error
          }
        }

        // Membership registration costs an extra call before the bill exists.
        const cost = product.model === "membership" ? 2 : 1
        const budget = await gate.acquire(cost)
        if (!budget.granted) {
          return bad("Demo sedang sibuk. Coba lagi sebentar lagi.", 503)
        }

        try {
          const outcome = await createCheckout({
            config,
            db: env.DB,
            product,
            buyer: { name, email, mobile },
            discount,
            couponCode,
          })

          if (couponCode && couponTerms) {
            await recordCouponApplied(env.DB, {
              orderId: outcome.orderId,
              couponCode,
              productId: product.productId,
              discountType: couponTerms.discountType,
              discountValue: couponTerms.discountValue,
              appliedAmount: discount.discount,
            })
          }

          // Start the reconciler now that something is waiting to be paid.
          await gate.wake()

          return Response.json({
            ...outcome,
            gross: discount.gross,
            discount: discount.discount,
            net: outcome.charged,
          })
        } catch (error) {
          if (error instanceof MayarApiError) {
            return Response.json(
              { error: error.message, issues: error.issues },
              { status: error.isDuplicate ? 409 : 502 }
            )
          }
          throw error
        }
      },
    },
  },
})
