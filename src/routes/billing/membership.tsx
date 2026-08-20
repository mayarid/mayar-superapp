import { createFileRoute } from "@tanstack/react-router"
import { MembershipPage } from "@/components/marketing/pages/membership-page"

export const Route = createFileRoute("/billing/membership")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Membership — Mayar Superapp" },
      {
        name: "description",
        content:
          "Langganan yang menagih per termin. Anggota didaftarkan dulu, tagihannya idempoten per periode.",
      },
      { property: "og:title", content: "Membership — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Langganan yang menagih per termin. Anggota didaftarkan dulu, tagihannya idempoten per periode.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <MembershipPage />
}
