import { createFileRoute } from "@tanstack/react-router"
import { BillingPage } from "@/components/billing/billing-page"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/membership")({
  component: Page,
  head: () => ({ meta: [{ title: "Membership — Mayar Superapp" }] }),
})

function Page() {
  return <BillingPage product={getProduct("membership")} />
}
