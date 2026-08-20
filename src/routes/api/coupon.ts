import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { findByModel } from "@/lib/catalog"
import { MayarApiError } from "@/lib/mayar/client"
import { getMayarConfig } from "@/lib/mayar/config"
import { validateCoupon } from "@/lib/mayar/operations"
import { applyDiscount } from "@/lib/money"
import type { DiscountType } from "@/lib/money"

/**
 * Coupon terms change rarely, and every uncached check spends one of the fifty
 * requests the whole app gets each minute. Caching them keeps a visitor typing
 * in the coupon field from starving checkout.
 */
const CACHE_TTL_SECONDS = 300

interface CachedTerms {
  discountType: DiscountType
  discountValue: number
}

export const Route = createFileRoute("/api/coupon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          model?: string
          couponCode?: string
        } | null

        const product = findByModel(body?.model)
        if (!product) {
          return Response.json(
            { error: "Model billing tidak dikenal." },
            { status: 400 }
          )
        }

        const code = body?.couponCode?.trim().toUpperCase()
        if (!code) {
          return Response.json(
            { error: "Kode diskon kosong." },
            { status: 400 }
          )
        }

        if (!product.coupons.includes(code)) {
          return Response.json(
            {
              valid: false,
              error: "Kode diskon tidak berlaku untuk produk ini.",
            },
            { status: 200 }
          )
        }

        const cacheKey = `coupon:${product.productId}:${code}`
        const cached = await env.CACHE.get<CachedTerms>(cacheKey, "json")

        let terms: CachedTerms
        if (cached) {
          terms = cached
        } else {
          const gate = env.MAYAR_GATE.getByName("global")
          const budget = await gate.acquire(1)
          if (!budget.granted) {
            return Response.json(
              { error: "Demo sedang sibuk. Coba lagi sebentar lagi." },
              { status: 503 }
            )
          }

          try {
            const result = await validateCoupon(getMayarConfig(), {
              couponCode: code,
              paymentLinkId: product.productId,
              amount: product.price,
            })
            if (!result.valid) {
              return Response.json({
                valid: false,
                error: "Kode diskon tidak berlaku.",
              })
            }
            terms = {
              discountType: result.coupon.discountType,
              discountValue: result.coupon.discountValue,
            }
            await env.CACHE.put(cacheKey, JSON.stringify(terms), {
              expirationTtl: CACHE_TTL_SECONDS,
            })
          } catch (error) {
            if (error instanceof MayarApiError && error.statusCode === 404) {
              return Response.json({
                valid: false,
                error:
                  "Kode diskon tidak ditemukan atau tidak berlaku di sini.",
              })
            }
            throw error
          }
        }

        const result = applyDiscount({
          gross: product.price,
          discountType: terms.discountType,
          discountValue: terms.discountValue,
        })

        return Response.json({
          valid: true,
          code,
          discountType: terms.discountType,
          discountValue: terms.discountValue,
          ...result,
        })
      },
    },
  },
})
