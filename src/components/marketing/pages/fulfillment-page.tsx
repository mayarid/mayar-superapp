import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta41 } from "@/components/marketing/blocks/cta41"
import { Faq1 } from "@/components/marketing/blocks/faq1"
import { Feature187 } from "@/components/marketing/blocks/feature187"
import { Feature28 } from "@/components/marketing/blocks/feature28"
import { Hero6 } from "@/components/marketing/blocks/hero6"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import { getProduct } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("fulfillment")
const COPY = getMarketing("fulfillment")
const PAY = `Bayar ${formatRupiah(PRODUCT.price)} dengan QRIS`

export function FulfillmentPage() {
  return (
    <MarketingLayout ctaLabel="Bayar sekarang">
      <Hero6
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Lihat cara penyerahannya", url: "#penyerahan" },
        }}
        images={[PHOTO.iconKit, PHOTO.designFiles]}
      />

      <Reveal>
        <Feature28
          cards={[
            {
              title: COPY.proofPoints[0].title,
              description: COPY.proofPoints[0].body,
              image: PHOTO.timer,
            },
            {
              title: COPY.proofPoints[1].title,
              description: COPY.proofPoints[1].body,
              image: PHOTO.singleKey,
            },
          ]}
        />
      </Reveal>

      <Reveal>
        <Feature187
          className="scroll-mt-24"
          heading="Dari lunas ke berkas, tanpa langkah manual"
          description={COPY.proofPoints[2].body}
          steps={COPY.steps.map((step) => ({
            title: step.title,
            description: step.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Faq1
          heading="Pertanyaan soal penyerahan berkas"
          items={COPY.faq.map((item, index) => ({
            id: `faq-${index}`,
            question: item.question,
            answer: item.answer,
          }))}
        />
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
