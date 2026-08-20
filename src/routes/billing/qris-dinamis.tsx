import { createFileRoute } from "@tanstack/react-router"
import { BillingPage } from "@/components/billing/billing-page"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/qris-dinamis")({
  component: Page,
  head: () => ({ meta: [{ title: "QRIS dinamis — Mayar Superapp" }] }),
})

function Page() {
  return <BillingPage product={getProduct("qris")} />
}
