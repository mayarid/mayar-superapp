import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta10 } from "@/components/marketing/blocks/cta10"
import { Faq3 } from "@/components/marketing/blocks/faq3"
import { Feature123 } from "@/components/marketing/blocks/feature123"
import { Feature187 } from "@/components/marketing/blocks/feature187"
import { Hero1 } from "@/components/marketing/blocks/hero1"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import { getProduct } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("sekali-bayar")
const COPY = getMarketing("sekali-bayar")
const PAY = `Bayar ${formatRupiah(PRODUCT.price)} dengan QRIS`

export function SekaliBayarPage() {
  return (
    <MarketingLayout ctaLabel="Bayar sekarang">
      <Hero1
        badge={{ text: COPY.eyebrow }}
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Lihat cara kerjanya", url: "#cara-kerja" },
        }}
        image={PHOTO.planner}
      />

      <Reveal>
        <Feature123
          eyebrow="Kenapa model ini"
          heading="Tagihan paling sederhana yang ada"
          description={PRODUCT.tagline}
          items={COPY.proofPoints.map((point) => ({
            title: point.title,
            description: point.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Feature187
          className="scroll-mt-24"
          heading="Tiga langkah dari klik sampai struk"
          description="Tidak ada webhook di jalur ini. Yang ada hanya satu pemanggilan API dan satu halaman yang menunggu."
          steps={COPY.steps.map((step) => ({
            title: step.title,
            description: step.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Faq3
          heading="Pertanyaan yang sering muncul"
          description="Termasuk hal yang tidak bisa dilakukan model ini."
          items={COPY.faq.map((item, index) => ({
            id: `faq-${index}`,
            question: item.question,
            answer: item.answer,
          }))}
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
