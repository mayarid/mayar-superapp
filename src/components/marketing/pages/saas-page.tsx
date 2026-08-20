import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react"
import { CheckoutSection } from "@/components/billing/checkout-section"
import { LicensePanel } from "@/components/billing/license-panel"
import { Cta10 } from "@/components/marketing/blocks/cta10"
import { Faq7 } from "@/components/marketing/blocks/faq7"
import { Feature118 } from "@/components/marketing/blocks/feature118"
import { Hero76 } from "@/components/marketing/blocks/hero76"
import { PHOTO } from "@/components/marketing/images"
import { MarketingLayout } from "@/components/marketing/marketing-layout"
import { Reveal } from "@/components/marketing/reveal"
import { getProduct } from "@/lib/catalog"
import { getMarketing } from "@/lib/marketing"
import { formatRupiah } from "@/lib/money"

const PRODUCT = getProduct("saas")
const COPY = getMarketing("saas")
const PAY = `Bayar ${formatRupiah(PRODUCT.price)} dengan QRIS`

export function SaasPage() {
  return (
    <MarketingLayout ctaLabel="Bayar sekarang">
      <Hero76
        badge={{ text: COPY.eyebrow }}
        heading={COPY.headline}
        description={COPY.subheadline}
        buttons={{
          primary: { text: PAY, url: "#checkout" },
          secondary: { text: "Aktifkan kode lisensi", url: "#lisensi" },
        }}
        image={PHOTO.licensedApp}
      />

      <Reveal>
        <Feature118
          heading="Aktivasi dan verifikasi, dua hal berbeda"
          description={PRODUCT.tagline}
          wide={{
            icon: KeyRoundIcon,
            title: COPY.proofPoints[0].title,
            body: COPY.proofPoints[0].body,
            image: PHOTO.codeScreen,
          }}
          list={{
            icon: ShieldCheckIcon,
            title: "Isi lisensinya",
            items: PRODUCT.includes,
          }}
          figures={[
            { value: "2", label: "endpoint: activate dan verify" },
            { value: "1", label: "perangkat per kode lisensi" },
            { value: "0", label: "kupon — nominalnya dihitung dari tier" },
          ]}
        />
      </Reveal>

      <Reveal>
        <section id="lisensi" className="container scroll-mt-24 py-16">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <div className="flex max-w-[62ch] flex-col gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Coba aktivasinya sekarang
              </h2>
              <p className="leading-relaxed text-pretty text-muted-foreground">
                Panel ini memanggil endpoint lisensi yang sebenarnya. Kalau
                kodemu belum ada, jawabannya akan mengatakan begitu.
              </p>
            </div>
            <LicensePanel />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <Faq7
          heading="Soal lisensi"
          headingMuted="dan yang tidak terdokumentasi."
          description={PRODUCT.mechanics}
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
