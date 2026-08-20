import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ReceiptTextIcon } from "lucide-react"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export const LAST_ORDER_KEY = "mayar-superapp:last-order"

/**
 * Offers a way back to an order that is still waiting.
 *
 * Mayar's payment page cannot send the buyer back — `payments/create` accepts
 * no redirectUrl, and setting one on the generated link is ignored. See
 * docs/api-findings.md. Without this, someone who pays and then closes the tab
 * has no route back to their own order.
 */
export function ResumeOrder() {
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(LAST_ORDER_KEY)
    if (!stored) return

    // Only offer the banner while the order can still change. A settled order
    // is noise, so forget it.
    void fetch(`/api/order/${stored}`)
      .then((response) =>
        response.ok ? response.json<{ status: string }>() : null
      )
      .then((data) => {
        if (!data) {
          localStorage.removeItem(LAST_ORDER_KEY)
          return
        }
        if (data.status === "created" || data.status === "pending") {
          setOrderId(stored)
        } else {
          localStorage.removeItem(LAST_ORDER_KEY)
        }
      })
      .catch(() => undefined)
  }, [])

  if (!orderId) return null

  return (
    <Alert>
      <ReceiptTextIcon />
      <AlertTitle>Ada pesanan yang belum selesai</AlertTitle>
      <AlertDescription>
        Halaman pembayaran Mayar tidak bisa mengembalikan kamu ke sini sendiri,
        jadi pesanannya disimpan di peramban ini.
      </AlertDescription>
      <AlertAction>
        <Button
          variant="outline"
          size="sm"
          render={<Link to="/checkout/$orderId" params={{ orderId }} />}
        >
          Lihat status
        </Button>
      </AlertAction>
    </Alert>
  )
}
