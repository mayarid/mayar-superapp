import { createFileRoute } from "@tanstack/react-router"
import { QrisPage } from "@/components/marketing/pages/qris-page"

export const Route = createFileRoute("/billing/qris-dinamis")({
  component: Page,
  head: () => ({
    meta: [
      { title: "QRIS dinamis — Mayar Superapp" },
      {
        name: "description",
        content:
          "Kode QR digambar di halaman ini, bukan di halaman Mayar. Nominalnya diberi kode unik.",
      },
      { property: "og:title", content: "QRIS dinamis — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Kode QR digambar di halaman ini, bukan di halaman Mayar. Nominalnya diberi kode unik.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <QrisPage />
}
