import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ResumeOrder } from "@/components/checkout/resume-order"
import { MODELS } from "@/lib/catalog"

export const Route = createFileRoute("/")({ component: IndexPage })

/** Models with a working page. The rest are listed but not yet linked. */
const LIVE = new Set(["sekali-bayar"])

function IndexPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-14">
      <header className="flex max-w-[60ch] flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Delapan cara menagih, satu aplikasi
        </h1>
        <p className="leading-relaxed text-pretty text-muted-foreground">
          Setiap model adalah cara menagih yang berbeda. Pilih berdasarkan
          bagaimana uangnya masuk, bukan berdasarkan apa yang kamu jual. Semua
          halaman di sini memakai checkout milik sendiri, mengutamakan QRIS, dan
          berjalan di lingkungan produksi.
        </p>
      </header>

      <ResumeOrder />

      <ul className="grid gap-4 sm:grid-cols-2">
        {MODELS.map((product) => {
          const live = LIVE.has(product.model)
          const card = (
            <Card
              className={
                live
                  ? "h-full transition-colors hover:border-ring"
                  : "h-full opacity-60"
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{product.title}</CardTitle>
                  {live ? (
                    <ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Badge variant="secondary">Segera</Badge>
                  )}
                </div>
                <CardDescription>{product.tagline}</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs break-all text-muted-foreground">
                  {product.endpoint}
                </code>
              </CardContent>
            </Card>
          )

          return (
            <li key={product.model}>
              {live ? (
                <Link
                  to="/billing/sekali-bayar"
                  className="block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                >
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
