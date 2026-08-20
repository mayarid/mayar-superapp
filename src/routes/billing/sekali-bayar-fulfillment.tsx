import { createFileRoute } from "@tanstack/react-router"
import { FulfillmentPage } from "@/components/marketing/pages/fulfillment-page"

export const Route = createFileRoute("/billing/sekali-bayar-fulfillment")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Sekali bayar + fulfillment — Mayar Superapp" },
      {
        name: "description",
        content:
          "Bayar sekali, lalu tautan unduhan berumur 15 menit terbit sendiri. Sekali terbit, sekali saja.",
      },
      {
        property: "og:title",
        content: "Sekali bayar + fulfillment — Mayar Superapp",
      },
      {
        property: "og:description",
        content:
          "Bayar sekali, lalu tautan unduhan berumur 15 menit terbit sendiri. Sekali terbit, sekali saja.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <FulfillmentPage />
}
