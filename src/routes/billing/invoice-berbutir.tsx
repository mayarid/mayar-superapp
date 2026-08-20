import { createFileRoute } from "@tanstack/react-router"
import { InvoicePage } from "@/components/marketing/pages/invoice-page"

export const Route = createFileRoute("/billing/invoice-berbutir")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Invoice berbutir — Mayar Superapp" },
      {
        name: "description",
        content:
          "Tagihan dengan beberapa baris pekerjaan. Diskon menyebar proporsional karena rate wajib positif.",
      },
      { property: "og:title", content: "Invoice berbutir — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Tagihan dengan beberapa baris pekerjaan. Diskon menyebar proporsional karena rate wajib positif.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <InvoicePage />
}
