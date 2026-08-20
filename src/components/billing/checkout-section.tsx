import { CheckIcon, InfoIcon } from "lucide-react"
import { ProductionNotice } from "@/components/billing/production-notice"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { ResumeOrder } from "@/components/checkout/resume-order"
import { Reveal } from "@/components/marketing/reveal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatRupiah } from "@/lib/money"
import type { DemoProduct } from "@/lib/catalog"

/**
 * Where every landing page ends.
 *
 * The old billing shell kept this form in a sticky sidebar. On a page this long
 * a sticky form competes with the copy it is meant to follow, so the form now
 * lives once, at the bottom, and the header CTA scrolls to it. The form itself
 * is untouched: it stays the single place a price is read and an order is
 * created.
 */
export function CheckoutSection({ product }: { product: DemoProduct }) {
  return (
    <section id="checkout" className="scroll-mt-24 border-t py-20">
      <div className="container">
        <Reveal className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="flex max-w-[62ch] flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Bayar dan lihat sendiri
            </h2>
            <p className="leading-relaxed text-pretty text-muted-foreground">
              Semua kolom di bawah milik aplikasi ini, bukan halaman Mayar.
              Harga diambil dari server, jadi tidak ada yang bisa diturunkan
              dari sisi peramban.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ProductionNotice />
            <ResumeOrder />
            {product.blocked ? (
              <Alert variant="destructive">
                <InfoIcon />
                <AlertTitle>Model ini belum bisa dijalankan</AlertTitle>
                <AlertDescription>{product.blocked}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
            <Card>
              <CardHeader>
                <CardTitle>Isi paket</CardTitle>
                <CardDescription>
                  Yang diterima pembeli setelah pembayaran lunas.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <ul className="flex flex-col gap-3">
                  {product.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 border-t pt-6">
                  <span className="text-3xl font-semibold tabular-nums">
                    {formatRupiah(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.couponBlocked
                      ? "harga tier, tanpa kupon"
                      : "sebelum kode diskon"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Endpoint utamanya{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    {product.endpoint}
                  </code>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>
                  Tiga kolom, satu kode diskon, satu tombol bayar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CheckoutForm product={product} />
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
