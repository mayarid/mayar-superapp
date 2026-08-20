import { createFileRoute } from "@tanstack/react-router"
import { SaasPage } from "@/components/marketing/pages/saas-page"

export const Route = createFileRoute("/billing/lisensi-saas")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Lisensi SaaS — Mayar Superapp" },
      {
        name: "description",
        content:
          "Satu kode, satu perangkat, sekali aktivasi. Satu-satunya model di jalur /saas/v2.",
      },
      { property: "og:title", content: "Lisensi SaaS — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Satu kode, satu perangkat, sekali aktivasi. Satu-satunya model di jalur /saas/v2.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <SaasPage />
}
