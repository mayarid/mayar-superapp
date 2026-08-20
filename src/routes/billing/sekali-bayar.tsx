import { createFileRoute } from "@tanstack/react-router"
import { SekaliBayarPage } from "@/components/marketing/pages/sekali-bayar-page"

export const Route = createFileRoute("/billing/sekali-bayar")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Sekali bayar — Mayar Superapp" },
      {
        name: "description",
        content:
          "Satu tautan bayar, satu harga. Checkout milik sendiri, QRIS lebih dulu, kode diskon dihitung di server.",
      },
      { property: "og:title", content: "Sekali bayar — Mayar Superapp" },
      {
        property: "og:description",
        content:
          "Satu tautan bayar, satu harga. Checkout milik sendiri, QRIS lebih dulu, kode diskon dihitung di server.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
})

function Page() {
  return <SekaliBayarPage />
}
