import { CalendarClockIcon, LayersIcon, WalletIcon } from "lucide-react"
import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta10 } from "@/components/marketing/blocks/cta10"
import { Faq16 } from "@/components/marketing/blocks/faq16"
import { Stats8 } from "@/components/marketing/blocks/stats8"
import { Feature187 } from "@/components/marketing/blocks/feature187"
import { Hero40 } from "@/components/marketing/blocks/hero40"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import {
  getProduct,
  INSTALLMENT_DUE_DAY,
  INSTALLMENT_TENURE,
} from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("cicilan")
const COPY = getMarketing("cicilan")
const PAY = `Bayar termin pertama ${formatRupiah(PRODUCT.price / INSTALLMENT_TENURE)}`

/**
 * The steps block doubles as the term schedule: three numbered steps for three
 * terms, with each term's amount computed from the catalog price rather than
 * written into the copy.
 */
const TERMS = Array.from({ length: INSTALLMENT_TENURE }, (_, index) => ({
  title: `Termin ${index + 1} — ${formatRupiah(PRODUCT.price / INSTALLMENT_TENURE)}`,
  description: COPY.steps[index].body,
}))

export function CicilanPage() {
  return (
    <MarketingLayout ctaLabel="Mulai cicilan">
      <Hero40
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Lihat jadwal termin", url: "#termin" },
        }}
        image={PHOTO.onlineCourse}
        integrations={COPY.proofPoints.map((point, index) => ({
          name: point.title,
          description: point.body,
          icon: [LayersIcon, CalendarClockIcon, WalletIcon][index],
        }))}
        checklistItems={PRODUCT.includes}
      />

      <Reveal>
        <Feature187
          className="scroll-mt-24"
          heading={`Tiga termin, total ${formatRupiah(PRODUCT.price)}`}
          description={PRODUCT.mechanics}
          steps={TERMS}
        />
      </Reveal>

      <Reveal>
        <Stats8
          heading="Angka yang mengikat model ini"
          description="Ketiganya berasal dari batas API, bukan dari pilihan halaman ini."
          stats={[
            {
              id: "tenor",
              value: `${INSTALLMENT_TENURE} bulan`,
              label: "tenor terpendek yang diizinkan — batasnya 3 sampai 24",
            },
            {
              id: "termin",
              value: String(INSTALLMENT_TENURE),
              label: "tagihan terbit sekaligus, masing-masing dengan tautannya",
            },
            {
              id: "jatuh-tempo",
              value: `Tgl ${INSTALLMENT_DUE_DAY}`,
              label: "jatuh tempo tiap termin, ditetapkan saat cicilan dibuat",
            },
          ]}
        />
      </Reveal>

      <Reveal>
        <Faq16 heading="Pertanyaan soal cicilan" items={COPY.faq} />
      </Reveal>

      <Reveal>
        <Cta10
          heading={COPY.closing.heading}
          description={COPY.closing.body}
          buttons={{ primary: { text: PAY, url: "#checkout" } }}
        />
      </Reveal>

      <CheckoutSection product={PRODUCT} />
    </MarketingLayout>
  )
}
