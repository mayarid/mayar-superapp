import { createFileRoute } from "@tanstack/react-router"
import { BillingPage } from "@/components/billing/billing-page"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/sekali-bayar-fulfillment")({
  component: Page,
  head: () => ({
    meta: [{ title: "Sekali bayar + fulfillment — Mayar Superapp" }],
  }),
})

function Page() {
  return <BillingPage product={getProduct("fulfillment")} />
}
