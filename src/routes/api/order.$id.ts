import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { getOrder, listFulfillments } from "@/server/orders"

/**
 * Order status for the waiting checkout page.
 *
 * The browser polls this, never Mayar. Reading D1 costs nothing against the
 * fifty-per-minute budget, so any number of visitors can watch their order at
 * once while a single reconciler does the actual asking.
 */
export const Route = createFileRoute("/api/order/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const order = await getOrder(env.DB, params.id)
        if (!order) {
          return Response.json(
            { error: "Pesanan tidak ditemukan." },
            { status: 404 }
          )
        }

        // Nudge the reconciler, in case its alarm lapsed while this order was
        // still waiting.
        if (order.status === "created" || order.status === "pending") {
          await env.MAYAR_GATE.getByName("global").wake()
        }

        const fulfillments = await listFulfillments(env.DB, order.id)

        return Response.json({
          id: order.id,
          model: order.model,
          status: order.status,
          gross: order.amount_gross,
          discount: order.amount_discount,
          net: order.amount_net,
          couponCode: order.coupon_code,
          payUrl: order.pay_url,
          transactionId: order.transaction_id,
          buyerName: order.buyer_name,
          buyerEmail: order.buyer_email,
          createdAt: order.created_at,
          expiresAt: order.expires_at,
          paidAt: order.paid_at,
          fulfillments: fulfillments.map((item) => ({
            kind: item.kind,
            at: item.created_at,
          })),
        })
      },
    },
  },
})
