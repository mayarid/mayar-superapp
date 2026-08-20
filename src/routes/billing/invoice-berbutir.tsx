import { createFileRoute } from "@tanstack/react-router"
import { BillingPage } from "@/components/billing/billing-page"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/invoice-berbutir")({
  component: Page,
  head: () => ({ meta: [{ title: "Invoice berbutir — Mayar Superapp" }] }),
})

function Page() {
  return <BillingPage product={getProduct("invoice")} />
}
