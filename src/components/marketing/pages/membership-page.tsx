import { CalendarSyncIcon, RepeatIcon } from "lucide-react"
import { CheckoutSection } from "@/components/billing/checkout-section"
import { Cta41 } from "@/components/marketing/blocks/cta41"
import { Faq20 } from "@/components/marketing/blocks/faq20"
import { Feature118 } from "@/components/marketing/blocks/feature118"
import { Feature187 } from "@/components/marketing/blocks/feature187"
import { Hero4 } from "@/components/marketing/blocks/hero4"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import { getProduct } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("membership")
const COPY = getMarketing("membership")
const PAY = `Bayar ${formatRupiah(PRODUCT.price)} dengan QRIS`

export function MembershipPage() {
  return (
    <MarketingLayout ctaLabel="Daftar sekarang">
      <Hero4
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Lihat alur terminnya", url: "#termin" },
        }}
        image={PHOTO.writingClass}
        // The block ships with a star rating and reviewer avatars. This app has
        // no reviews, and inventing them is the one thing a page cannot undo.
        reviews={undefined}
      />

      <Reveal>
        <Feature118
          heading="Keanggotaan dulu, tagihan menyusul"
          description={PRODUCT.tagline}
          wide={{
            icon: CalendarSyncIcon,
            title: COPY.proofPoints[0].title,
            body: COPY.proofPoints[0].body,
            image: PHOTO.writingDesk,
          }}
          list={{
            icon: RepeatIcon,
            title: COPY.proofPoints[1].title,
            items: PRODUCT.includes,
          }}
          figures={[
            { value: "2", label: "panggilan API untuk satu pendaftaran" },
            {
              value: "1",
              label: "tagihan terbuka per periode, tidak pernah dua",
            },
            { value: "0", label: "kupon — nominalnya dihitung dari tier" },
          ]}
        />
      </Reveal>

      <Reveal>
        <Feature187
          className="scroll-mt-24"
          heading="Bagaimana satu termin diterbitkan"
          description={PRODUCT.mechanics}
          steps={COPY.steps.map((step) => ({
            title: step.title,
            description: step.body,
          }))}
        />
      </Reveal>

      <Reveal>
        <Faq20
          heading="Pertanyaan soal langganan"
          description="Termasuk kenapa kode diskon tidak berlaku di jalur ini."
          contactLinkText="Coba langsung"
          contactLinkHref="#checkout"
          categories={[
            { title: "Tagihan dan termin", questions: COPY.faq.slice(0, 2) },
            { title: "Batas dan mekanika", questions: COPY.faq.slice(2) },
          ]}
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
