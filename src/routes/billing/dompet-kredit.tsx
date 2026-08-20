import { createFileRoute } from "@tanstack/react-router"
import { KreditPage } from "@/components/marketing/pages/kredit-page"

export const Route = createFileRoute("/billing/dompet-kredit")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Dompet kredit — Mayar Superapp" },
      {
        name: "description",
        content:
          "Beli kredit, terpotong tiap permintaan. Jalur endpointnya menjawab 404 dan itu ditampilkan apa adanya.",
      },
      { property: "og:title", content: "Dompet kredit — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Beli kredit, terpotong tiap permintaan. Jalur endpointnya menjawab 404 dan itu ditampilkan apa adanya.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <KreditPage />
}
