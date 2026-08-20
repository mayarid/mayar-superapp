import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta41 } from "@/components/marketing/blocks/cta41"
import { Faq16 } from "@/components/marketing/blocks/faq16"
import { Feature123 } from "@/components/marketing/blocks/feature123"
import { Hero9 } from "@/components/marketing/blocks/hero9"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Pricing6 } from "@/components/marketing/blocks/pricing6"
import { Reveal } from "@/components/marketing/reveal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CREDIT_PER_PURCHASE, getProduct } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"
import { InfoIcon } from "lucide-react"

const PRODUCT = getProduct("kredit")
const COPY = getMarketing("kredit")

/**
 * The snippet in the hero is the request this page would send, printed from
 * the same catalog values the server would use. It is shown rather than
 * described because the whole point of this page is that the call does not
 * currently work.
 */
const SNIPPET = `POST /hl/v2/credit/generate/immutable/checkout

{
  "tierId": "…",
  "credit": ${CREDIT_PER_PURCHASE}
}

→ 404 Not Found`

export function KreditPage() {
  return (
    <MarketingLayout ctaLabel="Lihat status">
      <Hero9
        badge={COPY.eyebrow}
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: "Baca kenapa terhalang", url: "#kenapa" },
        }}
        code={SNIPPET}
        codeLanguage="http"
      />

      <Reveal>
        <section id="kenapa" className="container scroll-mt-24 pb-4">
          <Alert variant="destructive">
            <InfoIcon />
            <AlertTitle>Model ini belum bisa dijalankan</AlertTitle>
            <AlertDescription>{PRODUCT.blocked}</AlertDescription>
          </Alert>
        </section>
      </Reveal>

      <Reveal>
        <Feature123
          eyebrow="Kalau jalurnya terbuka"
          heading="Beginilah dompet kredit seharusnya bekerja"
          description={PRODUCT.mechanics}
          items={COPY.steps.map((step) => ({
            title: step.title,
            description: step.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Pricing6
          heading="Satu paket kredit"
          description="Harga dan isinya dihitung dari tier, jadi tidak ada kolom yang bisa menimpanya — termasuk kode diskon, yang tidak berlaku di jalur ini."
          price={formatRupiah(PRODUCT.price)}
          priceNote="sekali beli"
          featureGroups={[PRODUCT.includes]}
          button={{ text: "Lihat formulirnya", url: "#checkout" }}
        />
      </Reveal>

      <Reveal>
        <Faq16 heading="Pertanyaan soal kredit" items={COPY.faq} />
      </Reveal>

      <Reveal>
        <Cta41
          heading={COPY.closing.heading}
          description={COPY.closing.body}
          buttons={{ primary: { text: "Lihat formulirnya", url: "#checkout" } }}
        />
      </Reveal>

      <CheckoutSection product={PRODUCT} />
    </MarketingLayout>
  )
}
