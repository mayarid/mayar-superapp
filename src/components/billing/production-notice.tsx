import { TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatRupiah, FLOOR_PRICE } from "@/lib/money"

/**
 * Shown on every page that can take money.
 *
 * This app runs against production, so a visitor who completes a checkout has
 * genuinely paid. That has to be impossible to miss.
 */
export function ProductionNotice() {
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Ini transaksi produksi sungguhan</AlertTitle>
      <AlertDescription>
        Pembayaran di halaman ini benar-benar memindahkan uang, bukan simulasi.
        Nominalnya ditahan di {formatRupiah(FLOOR_PRICE)} supaya murah, tetapi
        tetap nyata dan tidak otomatis kembali.
      </AlertDescription>
    </Alert>
  )
}
