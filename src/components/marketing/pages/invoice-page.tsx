import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta10 } from "@/components/marketing/blocks/cta10"
import { Faq7 } from "@/components/marketing/blocks/faq7"
import { Feature123 } from "@/components/marketing/blocks/feature123"
import { Stats8 } from "@/components/marketing/blocks/stats8"
import { Hero2 } from "@/components/marketing/blocks/hero2"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import { getProduct, INVOICE_ITEMS } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("invoice")
const COPY = getMarketing("invoice")
const PAY = `Bayar ${formatRupiah(PRODUCT.price)} dengan QRIS`

/**
 * The figures band shows the real invoice lines. They are read from the same
 * constant the server sends to Mayar, so the page cannot drift from the
 * tagihan it is describing.
 */
const LINES = INVOICE_ITEMS.map((item) => ({
  id: item.description,
  value: formatRupiah(item.rate),
  label: item.description,
}))

export function InvoicePage() {
  return (
    <MarketingLayout ctaLabel="Bayar sekarang">
      <Hero2
        badge={{ text: COPY.eyebrow }}
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Lihat rinciannya", url: "#rincian" },
        }}
        image={PHOTO.invoiceDesk}
      />

      <Reveal>
        <Stats8
          className="scroll-mt-24"
          heading="Tiga baris, satu tagihan"
          description="Inilah baris yang benar-benar dikirim ke invoices/create. Diskon menurunkan ketiganya secara proporsional, bukan menambah baris keempat."
          stats={LINES}
        />
      </Reveal>

      <Reveal>
        <Feature123
          eyebrow="Cara kerjanya"
          heading="Kenapa diskonnya tidak terlihat sebagai baris"
          description={PRODUCT.mechanics}
          items={COPY.steps.map((step) => ({
            title: step.title,
            description: step.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Faq7
          heading="Soal tagihan berbutir"
          headingMuted="dan batasnya."
          description="Yang bisa dan tidak bisa dilakukan endpoint invoice, ditulis apa adanya."
          items={COPY.faq}
        />
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
