import { createFileRoute } from "@tanstack/react-router"
import { BillingPage } from "@/components/billing/billing-page"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/lisensi-saas")({
  component: Page,
  head: () => ({ meta: [{ title: "Lisensi SaaS — Mayar Superapp" }] }),
})

function Page() {
  return <BillingPage product={getProduct("saas")} />
}
