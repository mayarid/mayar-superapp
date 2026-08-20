import { useState } from "react"
import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type Outcome = { ok: boolean; message: string } | null

/**
 * Activate and verify a licence code.
 *
 * The documentation never says where a code is first issued, and this panel
 * does not guess. It works on a code the visitor already has, and says plainly
 * that the origin is unverified rather than implying one.
 */
export function LicensePanel() {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState<"activate" | "verify" | null>(null)
  const [outcome, setOutcome] = useState<Outcome>(null)

  async function run(action: "activate" | "verify") {
    if (!code.trim()) return
    setBusy(action)
    setOutcome(null)
    try {
      const response = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, licenseCode: code.trim() }),
      })
      const data = await response.json<{
        ok?: boolean
        message?: string
        error?: string
      }>()
      setOutcome({
        ok: Boolean(data.ok),
        message: data.message ?? data.error ?? "Tidak ada jawaban.",
      })
    } catch {
      setOutcome({ ok: false, message: "Permintaan gagal. Coba lagi." })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivasi lisensi</CardTitle>
        <CardDescription>
          Endpoint di bawah berada di <code>/saas/v2</code>, satu-satunya di
          aplikasi ini yang tidak memakai <code>/hl/v2</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="license-code">Kode lisensi</FieldLabel>
          <Input
            id="license-code"
            value={code}
            placeholder="Tempel kode lisensimu"
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <FieldDescription>
            Dokumentasi Mayar tidak menyebutkan dari mana kode lisensi pertama
            kali terbit. Halaman ini sengaja tidak menebaknya — tempel kode yang
            sudah kamu punya, dan jawaban Mayar ditampilkan apa adanya.
          </FieldDescription>
        </Field>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => void run("activate")}
            disabled={busy !== null || !code.trim()}
          >
            {busy === "activate" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <KeyRoundIcon data-icon="inline-start" />
            )}
            Aktifkan
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void run("verify")}
            disabled={busy !== null || !code.trim()}
          >
            {busy === "verify" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ShieldCheckIcon data-icon="inline-start" />
            )}
            Periksa
          </Button>
        </div>

        {outcome ? (
          <p
            className={
              outcome.ok
                ? "text-sm leading-relaxed"
                : "text-sm leading-relaxed text-destructive"
            }
          >
            {outcome.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
