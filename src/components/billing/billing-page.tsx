import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, CheckIcon, InfoIcon } from "lucide-react"
import { ProductionNotice } from "@/components/billing/production-notice"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { ResumeOrder } from "@/components/checkout/resume-order"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DemoProduct } from "@/lib/catalog"

/**
 * The shell every billing model shares.
 *
 * The eight pages differ in what they sell and in their billing mechanics, not
 * in their structure. Keeping the structure in one place is what lets a reader
 * compare two models by looking only at the parts that actually differ.
 */
export function BillingPage({ product }: { product: DemoProduct }) {
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
        <ResumeOrder />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              {product.label}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {product.title}
            </h1>
            <p className="max-w-[60ch] leading-relaxed text-muted-foreground">
              {product.tagline}
            </p>
          </div>

          {product.blocked ? (
            <Alert variant="destructive">
              <InfoIcon />
              <AlertTitle>Model ini belum bisa dijalankan</AlertTitle>
              <AlertDescription>{product.blocked}</AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Isi paket</CardTitle>
              <CardDescription>
                Yang diterima pembeli setelah pembayaran lunas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {product.includes.map((item) => (
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
                Endpoint utamanya{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {product.endpoint}
                </code>
                .
              </p>
              <p>{product.mechanics}</p>
              <p className="text-muted-foreground">
                Aplikasi ini tidak memakai webhook. Status pembayaran diketahui
                dengan menanyai Mayar dari satu durable object, sekali tiap lima
                detik untuk semua pesanan sekaligus, karena seluruh aplikasi
                berbagi jatah lima puluh permintaan per menit.
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
