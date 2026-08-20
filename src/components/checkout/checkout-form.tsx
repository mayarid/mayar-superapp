import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { CheckIcon, TicketIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { LAST_ORDER_KEY } from "@/components/checkout/resume-order"
import { formatRupiah } from "@/lib/money"
import type { DemoProduct } from "@/lib/catalog"

interface CouponState {
  code: string
  discount: number
  net: number
}

export function CheckoutForm({ product }: { product: DemoProduct }) {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [couponInput, setCouponInput] = useState("")

  const [coupon, setCoupon] = useState<CouponState | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponChecking, setCouponChecking] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const gross = product.price
  const discount = coupon?.discount ?? 0
  const net = coupon?.net ?? gross

  async function checkCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return

    setCouponChecking(true)
    setCouponError(null)
    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: product.model, couponCode: code }),
      })
      const data = await response.json<{
        valid?: boolean
        error?: string
        discount?: number
        net?: number
      }>()

      if (!data.valid) {
        setCoupon(null)
        setCouponError(data.error ?? "Kode diskon tidak berlaku.")
        return
      }

      setCoupon({ code, discount: data.discount ?? 0, net: data.net ?? gross })
    } catch {
      setCouponError("Gagal memeriksa kode diskon. Coba lagi.")
    } finally {
      setCouponChecking(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    // Opened synchronously, inside the click, and pointed at the real URL once
    // the server answers. A browser only grants window.open during a user
    // gesture, and awaiting the fetch first would spend that gesture and get
    // the popup blocked.
    const payWindow = window.open("about:blank", "_blank")

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: product.model,
          name,
          email,
          mobile,
          couponCode: coupon?.code ?? null,
        }),
      })
      const data = await response.json<{
        orderId?: string
        payUrl?: string
        error?: string
      }>()

      if (!response.ok || !data.payUrl || !data.orderId) {
        payWindow?.close()
        setFormError(data.error ?? "Checkout gagal. Coba lagi.")
        setSubmitting(false)
        return
      }

      // Kept so the order is reachable again if every tab is closed. Mayar
      // cannot send the buyer back on its own — see docs/api-findings.md.
      localStorage.setItem(LAST_ORDER_KEY, data.orderId)

      if (payWindow && !payWindow.closed) {
        payWindow.opener = null
        payWindow.location.replace(data.payUrl)
        // This tab stays alive and watches the order, so it can advance to the
        // receipt by itself the moment the payment lands.
        await navigate({
          to: "/checkout/$orderId",
          params: { orderId: data.orderId },
        })
      } else {
        // Popup blocked. Fall back to this tab; the buyer returns by hand.
        window.location.href = data.payUrl
      }
    } catch {
      payWindow?.close()
      setFormError("Checkout gagal. Coba lagi.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="buyer-name">Nama lengkap</FieldLabel>
          <Input
            id="buyer-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="buyer-email">Email</FieldLabel>
          <Input
            id="buyer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <FieldDescription>
            Bukti pembayaran dikirim ke alamat ini, dan email ini yang mengenali
            kamu saat kembali.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="buyer-mobile">Nomor telepon</FieldLabel>
          <Input
            id="buyer-mobile"
            type="tel"
            inputMode="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            autoComplete="tel"
            required
          />
        </Field>

        <Field data-invalid={couponError ? true : undefined}>
          <FieldLabel htmlFor="coupon">Kode diskon</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="coupon"
              value={couponInput}
              placeholder={product.coupons[0]}
              aria-invalid={couponError ? true : undefined}
              onChange={(event) => {
                setCouponInput(event.target.value)
                setCoupon(null)
                setCouponError(null)
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                onClick={checkCoupon}
                disabled={couponChecking || !couponInput.trim()}
              >
                {couponChecking ? (
                  <Spinner />
                ) : coupon ? (
                  <CheckIcon />
                ) : (
                  <TicketIcon />
                )}
                {coupon ? "Terpakai" : "Pakai"}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {couponError ? (
            <FieldError>{couponError}</FieldError>
          ) : (
            <FieldDescription>
              Coba {product.coupons.join(" atau ")}.
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>

      <Separator />

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Harga daftar</dt>
          <dd className="tabular-nums">{formatRupiah(gross)}</dd>
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Diskon {coupon?.code}</dt>
            <dd className="tabular-nums">−{formatRupiah(discount)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between font-medium">
          <dt>Dibayar</dt>
          <dd className="tabular-nums">{formatRupiah(net)}</dd>
        </div>
      </dl>

      {formError ? <FieldError>{formError}</FieldError> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? <Spinner data-icon="inline-start" /> : null}
        Bayar {formatRupiah(net)} dengan QRIS
      </Button>

      <p className="text-xs text-muted-foreground">
        Pembayaran terbuka di tab baru. Halaman ini tetap memantau pesananmu dan
        berpindah sendiri ke struk begitu uangnya masuk — Mayar tidak bisa
        mengembalikan kamu ke sini, jadi tab inilah yang menunggu.
      </p>
    </form>
  )
}
