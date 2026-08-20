import { Link } from "@tanstack/react-router"
import { QrCodeIcon } from "lucide-react"
import { MODELS } from "@/lib/catalog"
import { HREF } from "@/lib/marketing"

/**
 * Adapted from @shadcnblocks/footer7. The block's social row was dropped — it
 * pulls in react-icons for accounts this app does not have, and an empty social
 * row is worse than none. The link columns are built from the catalog so a new
 * billing model reaches the footer without a second edit.
 */

const HALF = Math.ceil(MODELS.length / 2)
const COLUMNS = [
  { title: "Model billing", models: MODELS.slice(0, HALF) },
  { title: "Model billing lainnya", models: MODELS.slice(HALF) },
]

export function SiteFooter() {
  return (
    <footer className="border-t py-16">
      <div className="container">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start">
          <div className="flex w-full max-w-sm flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <QrCodeIcon className="size-4" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Mayar Superapp
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Delapan cara menagih dengan satu API. Setiap halaman memakai
              checkout milik sendiri, mengutamakan QRIS, dan berjalan di
              lingkungan produksi dengan uang sungguhan.
            </p>
          </div>

          <div className="grid w-full gap-8 sm:grid-cols-2 lg:gap-20">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h3 className="font-semibold tracking-tight">{column.title}</h3>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {column.models.map((product) => (
                    <li key={product.model}>
                      <Link
                        to={HREF[product.model]}
                        className="font-medium transition-colors hover:text-foreground"
                      >
                        {product.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Aplikasi demo integrasi Mayar. Pembayaran di sini nyata.</p>
          <p>Tidak memakai webhook — status pesanan ditanyakan berkala.</p>
        </div>
      </div>
    </footer>
  )
}
