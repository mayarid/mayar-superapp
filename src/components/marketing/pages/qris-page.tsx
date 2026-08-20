import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta41 } from "@/components/marketing/blocks/cta41"
import { Faq9 } from "@/components/marketing/blocks/faq9"
import { Feature187 } from "@/components/marketing/blocks/feature187"
import { Feature28 } from "@/components/marketing/blocks/feature28"
import { Hero8 } from "@/components/marketing/blocks/hero8"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import { getProduct } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("qris")
const COPY = getMarketing("qris")
const PAY = `Bayar ${formatRupiah(PRODUCT.price)} dengan QRIS`

export function QrisPage() {
  return (
    <MarketingLayout ctaLabel="Buat kode QR">
      <Hero8
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Kenapa nominalnya unik", url: "#kode-unik" },
        }}
        image={PHOTO.coffeeCounter}
      />

      <Reveal>
        <Feature28
          className="scroll-mt-24"
          cards={[
            {
              title: COPY.proofPoints[0].title,
              description: COPY.proofPoints[0].body,
              image: PHOTO.qrOnPhone,
            },
            {
              title: COPY.proofPoints[1].title,
              description: COPY.proofPoints[1].body,
              image: PHOTO.priceLabel,
            },
          ]}
        />
      </Reveal>

      <Reveal>
        <Feature187
          className="scroll-mt-24"
          heading="Dari nominal ke pembayaran yang dikenali"
          description={COPY.proofPoints[2].body}
          steps={COPY.steps.map((step) => ({
            title: step.title,
            description: step.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Faq9 heading="Pertanyaan soal QRIS" items={COPY.faq} />
      </Reveal>

      <Reveal>
        <Cta41
          heading={COPY.closing.heading}
          description={COPY.closing.body}
          buttons={{ primary: { text: PAY, url: "#checkout" } }}
        />
      </Reveal>

      <CheckoutSection product={PRODUCT} />
    </MarketingLayout>
  )
}
