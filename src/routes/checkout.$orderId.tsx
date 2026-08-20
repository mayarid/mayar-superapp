import { useCallback, useEffect, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { formatRupiah } from "@/lib/money"

export const Route = createFileRoute("/checkout/$orderId")({
  component: CheckoutStatusPage,
  head: () => ({ meta: [{ title: "Status pesanan — Mayar Superapp" }] }),
})

interface OrderView {
  id: string
  model: string
  status: "created" | "pending" | "paid" | "expired" | "ambiguous"
  gross: number
  discount: number
  net: number
  couponCode: string | null
  payUrl: string | null
  transactionId: string | null
  buyerName: string | null
  buyerEmail: string | null
  paidAt: number | null
  fulfillments: Array<{ kind: string; at: number }>
}

/** How often the browser asks our own server. This never touches Mayar. */
const POLL_MS = 3000

function CheckoutStatusPage() {
  const { orderId } = Route.useParams()
  const [order, setOrder] = useState<OrderView | null>(null)
  const [missing, setMissing] = useState(false)
  const [checking, setChecking] = useState(false)

  const load = useCallback(async () => {
    setChecking(true)
    try {
      const response = await fetch(`/api/order/${orderId}`)
      if (response.status === 404) {
        setMissing(true)
        return
      }
      setOrder(await response.json<OrderView>())
    } finally {
      setChecking(false)
    }
  }, [orderId])

  const settled =
    order?.status === "paid" ||
    order?.status === "expired" ||
    order?.status === "ambiguous"

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (settled || missing) return
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [settled, missing, load])

  if (missing) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Pesanan tidak ditemukan</CardTitle>
            <CardDescription>
              Nomor pesanan {orderId} tidak ada di basis data ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/" />}>Kembali ke daftar model</Button>
          </CardContent>
        </Card>
      </Shell>
    )
  }

  if (!order) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          Memuat pesanan…
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{TITLES[order.status]}</CardTitle>
              <CardDescription>{DESCRIPTIONS[order.status]}</CardDescription>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <dl className="flex flex-col gap-2 text-sm">
            <Row
              label="Nomor pesanan"
              value={<code className="text-xs">{order.id}</code>}
            />
            {order.buyerName ? (
              <Row label="Pembeli" value={order.buyerName} />
            ) : null}
            {order.buyerEmail ? (
              <Row label="Email" value={order.buyerEmail} />
            ) : null}
            <Separator className="my-1" />
            <Row
              label="Harga daftar"
              value={formatRupiah(order.gross)}
              numeric
            />
            {order.discount > 0 ? (
              <Row
                label={`Diskon ${order.couponCode ?? ""}`.trim()}
                value={`−${formatRupiah(order.discount)}`}
                numeric
              />
            ) : null}
            <Row
              label="Dibayar"
              value={formatRupiah(order.net)}
              numeric
              emphasis
            />
            {order.transactionId ? (
              <Row
                label="Transaksi Mayar"
                value={<code className="text-xs">{order.transactionId}</code>}
              />
            ) : null}
          </dl>

          {(order.status === "pending" || order.status === "created") &&
          order.model === "qris" &&
          order.payUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={order.payUrl}
                alt="Kode QRIS untuk pesanan ini"
                className="size-64 rounded-lg border bg-white p-2"
                width={256}
                height={256}
              />
              <p className="text-center text-sm text-muted-foreground">
                Pindai dengan aplikasi pembayaran apa pun. Bayar tepat{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatRupiah(order.net)}
                </span>{" "}
                — tiga angka terakhirnya adalah kode unik yang membedakan
                pembayaranmu dari yang lain.
              </p>
            </div>
          ) : null}

          {(order.status === "pending" || order.status === "created") &&
          order.model !== "qris" ? (
            <div className="flex flex-col gap-3">
              {order.payUrl ? (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={order.payUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  Buka lagi halaman pembayaran
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => void load()}
                disabled={checking}
              >
                {checking ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <RefreshCwIcon data-icon="inline-start" />
                )}
                Saya sudah bayar, cek status
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Halaman ini menanyai server aplikasi setiap tiga detik, bukan
                Mayar. Yang menanyai Mayar hanya satu durable object, sekali
                tiap lima detik untuk semua pesanan sekaligus.
              </p>
            </div>
          ) : null}

          {order.status === "ambiguous" ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Lebih dari satu pembayaran cocok dengan pesanan ini, jadi aplikasi
              menolak menebak. Model ini dicocokkan tanpa nomor transaksi, dan
              menebak berarti menyerahkan barang ke pembeli yang salah.
            </p>
          ) : null}

          {order.fulfillments.some((item) => item.kind === "r2_grant") ? (
            <Button render={<a href={`/api/fulfill/${order.id}`} />}>
              <DownloadIcon data-icon="inline-start" />
              Unduh berkas
            </Button>
          ) : null}

          {order.fulfillments.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Yang sudah diberikan</p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {order.fulfillments.map((item) => (
                  <li key={item.kind} className="flex items-center gap-2">
                    <CheckCircle2Icon className="size-4" />
                    {FULFILLMENT_LABELS[item.kind] ?? item.kind}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
      {children}
    </main>
  )
}

function Row({
  label,
  value,
  numeric,
  emphasis,
}: {
  label: string
  value: React.ReactNode
  numeric?: boolean
  emphasis?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${emphasis ? "font-medium" : ""}`}
    >
      <dt className={emphasis ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className={numeric ? "tabular-nums" : ""}>{value}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: OrderView["status"] }) {
  if (status === "paid") {
    return (
      <Badge>
        <CheckCircle2Icon />
        Lunas
      </Badge>
    )
  }
  if (status === "expired" || status === "ambiguous") {
    return (
      <Badge variant="destructive">
        <CircleAlertIcon />
        {status === "expired" ? "Kedaluwarsa" : "Perlu ditinjau"}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <ClockIcon />
      Menunggu
    </Badge>
  )
}

const TITLES: Record<OrderView["status"], string> = {
  created: "Menunggu pembayaran",
  pending: "Menunggu pembayaran",
  paid: "Pembayaran diterima",
  expired: "Pesanan kedaluwarsa",
  ambiguous: "Pembayaran perlu ditinjau",
}

const DESCRIPTIONS: Record<OrderView["status"], string> = {
  created: "Selesaikan pembayaran di tab sebelah. Halaman ini menunggu.",
  pending: "Selesaikan pembayaran di tab sebelah. Halaman ini menunggu.",
  paid: "Uangnya sudah masuk dan pesanan ini sudah dipenuhi.",
  expired: "Batas waktu pembayaran lewat sebelum uang masuk.",
  ambiguous: "Pencocokan menemukan lebih dari satu kandidat.",
}

const FULFILLMENT_LABELS: Record<string, string> = {
  receipt: "Struk pembayaran",
  r2_grant: "Tautan unduhan",
  membership_register: "Keanggotaan terdaftar",
  credit_add: "Kredit ditambahkan",
  license_issue: "Kode lisensi terbit",
  schedule: "Jadwal cicilan",
}
