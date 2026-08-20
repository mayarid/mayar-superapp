import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import { ResumeOrder } from "@/components/checkout/resume-order"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MODELS } from "@/lib/catalog"
import { formatRupiah } from "@/lib/money"
import type { BillingModel } from "@/lib/catalog"

export const Route = createFileRoute("/")({ component: IndexPage })

/**
 * Written out rather than built from the slug, because the router types each
 * route path as a literal and a template string would not satisfy them.
 */
const HREF = {
  "sekali-bayar": "/billing/sekali-bayar",
  fulfillment: "/billing/sekali-bayar-fulfillment",
  invoice: "/billing/invoice-berbutir",
  membership: "/billing/membership",
  kredit: "/billing/dompet-kredit",
  saas: "/billing/lisensi-saas",
  qris: "/billing/qris-dinamis",
  cicilan: "/billing/cicilan",
} as const satisfies Record<BillingModel, string>

function IndexPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-14">
      <header className="flex max-w-[62ch] flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Delapan cara menagih, satu aplikasi
        </h1>
        <p className="leading-relaxed text-pretty text-muted-foreground">
          Setiap model adalah cara menagih yang berbeda. Pilih berdasarkan
          bagaimana uangnya masuk, bukan berdasarkan apa yang kamu jual. Semua
          halaman di sini memakai checkout milik sendiri, mengutamakan QRIS, dan
          berjalan di lingkungan produksi dengan uang sungguhan.
        </p>
      </header>

      <ResumeOrder />

      <ul className="grid gap-4 sm:grid-cols-2">
        {MODELS.map((product) => (
          <li key={product.model}>
            <Link
              to={HREF[product.model]}
              className="block h-full rounded-lg focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              <Card
                className={
                  product.blocked
                    ? "h-full border-dashed"
                    : "h-full transition-colors hover:border-ring"
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {product.label}
                      </span>
                      <CardTitle>{product.title}</CardTitle>
                    </div>
                    {product.blocked ? (
                      <Badge variant="secondary">Terhalang</Badge>
                    ) : (
                      <ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>{product.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <code className="text-xs break-all text-muted-foreground">
                    {product.endpoint}
                  </code>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="tabular-nums">
                      {formatRupiah(product.price)}
                    </span>
                    <span className="text-muted-foreground">
                      {product.couponBlocked ? "tanpa kupon" : "bisa didiskon"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        Tiga model dijual lewat tier, dan endpoint tagihannya menghitung nominal
        dari tier itu tanpa menerima penimpaan — jadi kupon hanya berlaku di
        lima model lainnya. Batas seperti ini sengaja ditampilkan, bukan
        disembunyikan.
      </p>
    </main>
  )
}
