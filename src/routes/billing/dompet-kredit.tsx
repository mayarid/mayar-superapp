import { createFileRoute } from "@tanstack/react-router"
import { BillingPage } from "@/components/billing/billing-page"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/dompet-kredit")({
  component: Page,
  head: () => ({ meta: [{ title: "Dompet kredit — Mayar Superapp" }] }),
})

function Page() {
  return <BillingPage product={getProduct("kredit")} />
}
