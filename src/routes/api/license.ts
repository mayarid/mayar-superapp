import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { getProduct } from "@/lib/catalog"
import { MayarApiError } from "@/lib/mayar/client"
import { getMayarConfig } from "@/lib/mayar/config"
import { activateLicense, verifyLicense } from "@/lib/mayar/operations"

interface Body {
  action?: "activate" | "verify"
  licenseCode?: string
}

/**
 * Activates or verifies a SaaS licence code.
 *
 * These are the only endpoints in the app under `/saas/v2` rather than
 * `/hl/v2`. Where a code comes from in the first place is not documented, so
 * this route only handles a code the caller already has — it does not pretend
 * to issue one.
 */
export const Route = createFileRoute("/api/license")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json<Body>().catch(() => null)
        const action = body?.action
        const licenseCode = body?.licenseCode?.trim()

        if (action !== "activate" && action !== "verify") {
          return Response.json(
            { error: "Aksi tidak dikenal." },
            { status: 400 }
          )
        }
        if (!licenseCode) {
          return Response.json(
            { error: "Kode lisensi wajib diisi." },
            { status: 400 }
          )
        }

        const product = getProduct("saas")
        const gate = env.MAYAR_GATE.getByName("global")
        const budget = await gate.acquire(1)
        if (!budget.granted) {
          return Response.json(
            { error: "Demo sedang sibuk. Coba lagi sebentar lagi." },
            { status: 503 }
          )
        }

        const payload = { licenseCode, productId: product.productId }
        try {
          const result =
            action === "activate"
              ? await activateLicense(getMayarConfig(), payload)
              : await verifyLicense(getMayarConfig(), payload)

          return Response.json({
            ok: true,
            action,
            // These endpoints answer with a status and a message only, so the
            // message is passed through rather than reinterpreted.
            message: result.message ?? result.status ?? "Berhasil.",
          })
        } catch (error) {
          if (error instanceof MayarApiError) {
            return Response.json(
              { ok: false, action, error: error.message },
              { status: error.statusCode >= 500 ? 502 : 400 }
            )
          }
          throw error
        }
      },
    },
  },
})
