import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { DELIVERABLE_KEY, GRANT_TTL_MS } from "@/server/fulfillment"
import { getOrder, listFulfillments } from "@/server/orders"

/**
 * Serves the file bought through the fulfillment model.
 *
 * Access is decided by the fulfillment log, not by the request: the file is
 * released only when the order is paid and an `r2_grant` was recorded for it.
 * The grant also expires, so a link shared later stops working.
 */
export const Route = createFileRoute("/api/fulfill/$id")({
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
        if (order.status !== "paid") {
          return Response.json(
            { error: "Pesanan ini belum lunas." },
            { status: 402 }
          )
        }

        const grant = (await listFulfillments(env.DB, order.id)).find(
          (item) => item.kind === "r2_grant"
        )
        if (!grant) {
          return Response.json(
            { error: "Pesanan ini tidak memberi hak unduh." },
            { status: 403 }
          )
        }

        if (Date.now() - grant.created_at > GRANT_TTL_MS) {
          return Response.json(
            { error: "Tautan unduhan sudah kedaluwarsa. Muat ulang halaman." },
            { status: 410 }
          )
        }

        const object = await env.ASSETS_BUCKET.get(DELIVERABLE_KEY)
        if (!object) {
          return Response.json(
            { error: "Berkas belum tersedia di penyimpanan." },
            { status: 404 }
          )
        }

        return new Response(object.body, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="paket-ikon-antarmuka.zip"`,
            "Cache-Control": "private, no-store",
          },
        })
      },
    },
  },
})
