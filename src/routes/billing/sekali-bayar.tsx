import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, CheckIcon } from "lucide-react"
import { ProductionNotice } from "@/components/billing/production-notice"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getProduct } from "@/lib/catalog"

export const Route = createFileRoute("/billing/sekali-bayar")({
  component: SekaliBayarPage,
  head: () => ({
    meta: [{ title: "Sekali bayar — Mayar Superapp" }],
  }),
})

const INCLUDES = [
  "Basis data Notion siap pakai",
  "Tampilan kalender, papan, dan tabel",
  "Panduan pemakaian singkat",
  "Pembaruan seumur hidup",
]

function SekaliBayarPage() {
  const product = getProduct("sekali-bayar")

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Semua model billing
        </Link>
        <ProductionNotice />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              Sekali bayar
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {product.title}
            </h1>
            <p className="max-w-[60ch] leading-relaxed text-muted-foreground">
              {product.tagline} Tidak ada langganan, tidak ada perpanjangan.
              Satu transaksi, lalu selesai.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Isi paket</CardTitle>
              <CardDescription>
                Semua yang kamu terima setelah pembayaran lunas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bagaimana ini bekerja</CardTitle>
              <CardDescription>
                Mekanika penagihan di balik halaman ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm leading-relaxed">
              <p>
                Formulir di samping milik aplikasi ini sepenuhnya, termasuk
                kolom kode diskon. Saat kamu menekan bayar, server memanggil{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {product.endpoint}
                </code>{" "}
                dengan nominal yang sudah didiskon, lalu membawa kamu ke halaman
                pembayaran Mayar yang dikunci ke QRIS.
              </p>
              <p>
                Aplikasi ini tidak memakai webhook. Status pembayaran diketahui
                dengan menanyai daftar transaksi Mayar setiap lima detik dari
                satu durable object, bukan satu permintaan per pesanan — karena
                seluruh aplikasi berbagi jatah lima puluh permintaan per menit.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>
              Semua kolom di bawah milik aplikasi ini, bukan halaman Mayar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckoutForm product={product} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
