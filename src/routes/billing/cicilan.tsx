import { createFileRoute } from "@tanstack/react-router"
import { CicilanPage } from "@/components/marketing/pages/cicilan-page"

export const Route = createFileRoute("/billing/cicilan")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Cicilan — Mayar Superapp" },
      {
        name: "description",
        content:
          "Bayar bertahap selama tiga bulan. Tiap termin adalah tagihan tersendiri dengan tautannya sendiri.",
      },
      { property: "og:title", content: "Cicilan — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Bayar bertahap selama tiga bulan. Tiap termin adalah tagihan tersendiri dengan tautannya sendiri.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <CicilanPage />
}
