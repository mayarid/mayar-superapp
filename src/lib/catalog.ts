import { LIST_PRICE } from "./money"
import type { Rupiah } from "./money"

/**
 * Server-owned product data.
 *
 * Prices are never taken from the client. A checkout request names a model and
 * the server looks the price up here, so a tampered request cannot lower what
 * Mayar is asked to charge.
 */

export type BillingModel =
  | "sekali-bayar"
  | "fulfillment"
  | "invoice"
  | "membership"
  | "kredit"
  | "saas"
  | "qris"
  | "cicilan"

export interface DemoProduct {
  model: BillingModel
  /** Route segment under /billing. */
  slug: string
  /** What the visitor sees this page selling. */
  title: string
  tagline: string
  /** Mayar product id. Also the paymentLinkId used to validate coupons. */
  productId: string
  price: Rupiah
  /** Coupon codes bound to this product in Mayar. Empty means none exist. */
  coupons: string[]
  /** Endpoint shown on the page, so the mechanics stay visible. */
  endpoint: string
}

export const CATALOG: Record<BillingModel, DemoProduct> = {
  "sekali-bayar": {
    model: "sekali-bayar",
    slug: "sekali-bayar",
    title: "Template Notion Perencana Konten",
    tagline: "Satu berkas, sekali bayar, langsung dipakai.",
    productId: "d14287f3-3e94-4b20-9e7a-353b26edfcf2",
    price: LIST_PRICE,
    coupons: ["SEKALI50", "SEKALI1K"],
    endpoint: "POST /hl/v2/payments/create",
  },
  fulfillment: {
    model: "fulfillment",
    slug: "sekali-bayar-fulfillment",
    title: "Paket Ikon Antarmuka",
    tagline: "Sekali bayar, tautan unduhan terbit otomatis setelah lunas.",
    productId: "7999277b-eaf4-45c9-bd45-57c55e7bb6f8",
    price: LIST_PRICE,
    coupons: ["FULFILL50", "FULFILL1K"],
    endpoint: "POST /hl/v2/payments/create + R2 signed URL",
  },
  invoice: {
    model: "invoice",
    slug: "invoice-berbutir",
    title: "Jasa Desain Per Proyek",
    tagline: "Tagihan berbutir dengan beberapa baris pekerjaan.",
    productId: "0df14920-464a-4345-847c-a9128d29660c",
    price: LIST_PRICE,
    coupons: ["INVOICE50", "INVOICE1K"],
    endpoint: "POST /hl/v2/invoices/create",
  },
  membership: {
    model: "membership",
    slug: "membership",
    title: "Kelas Menulis Bulanan",
    tagline: "Langganan bulanan dengan tagihan per termin.",
    productId: "9b52b22e-1a0c-4fd7-b9c3-c66c234b83f5",
    price: LIST_PRICE,
    // Deliberately empty. The membership invoice endpoint computes its amount
    // from the tier and accepts no discount parameter, so a coupon field here
    // would be theatre. See docs/api-findings.md.
    coupons: [],
    endpoint: "POST /hl/v2/memberships/members/create",
  },
  kredit: {
    model: "kredit",
    slug: "dompet-kredit",
    title: "Asisten AI Berbasis Kredit",
    tagline: "Beli kredit, terpotong tiap permintaan.",
    productId: "8244bf38-32c1-4465-93f9-d4fa201a1b5f",
    price: LIST_PRICE,
    coupons: ["KREDIT50", "KREDIT1K"],
    endpoint: "POST /hl/v2/credit/generate/immutable/checkout",
  },
  saas: {
    model: "saas",
    slug: "lisensi-saas",
    title: "Aplikasi Desktop Berlisensi",
    tagline: "Lisensi diaktifkan dengan kode.",
    productId: "8137866c-72d5-4b4d-891b-921d66916ee3",
    price: LIST_PRICE,
    coupons: ["SAAS50", "SAAS1K"],
    endpoint: "POST /saas/v2/license/activate",
  },
  qris: {
    model: "qris",
    slug: "qris-dinamis",
    title: "Kasir Kedai Kopi",
    tagline: "QRIS on-demand, dipindai langsung di tempat.",
    productId: "d901cbe2-9a29-4146-9113-24aebc840fb5",
    price: LIST_PRICE,
    coupons: ["QRIS50", "QRIS1K"],
    endpoint: "POST /hl/v2/qr-codes/create",
  },
  cicilan: {
    model: "cicilan",
    slug: "cicilan",
    title: "Kursus Daring Berbayar Cicil",
    tagline: "Bayar bertahap selama beberapa bulan.",
    productId: "c19b9bd6-974e-4f59-b170-37ea032f5c01",
    price: LIST_PRICE,
    coupons: ["CICILAN50", "CICILAN1K"],
    endpoint: "POST /hl/v2/installments/create",
  },
}

/** Membership tiers, needed by the models that sell through a tier. */
export const TIERS = {
  membership: "7ce53f2a-b055-4a18-a04e-0eaabb3c2151",
  kredit: "004425f1-135b-4013-8d7a-8ef4550dc3d7",
  saas: "d1db3f30-550d-4881-9eb0-c535559f55eb",
} as const

/** How many wallet units the credit tier grants per purchase. */
export const CREDIT_PER_PURCHASE = 100

export const MODELS = Object.values(CATALOG)

export function findBySlug(slug: string): DemoProduct | undefined {
  return MODELS.find((product) => product.slug === slug)
}

export function getProduct(model: BillingModel): DemoProduct {
  return CATALOG[model]
}

/** Looks up a model named by an untrusted request, without asserting it exists. */
export function findByModel(
  model: string | undefined
): DemoProduct | undefined {
  if (!model) return undefined
  return Object.hasOwn(CATALOG, model)
    ? CATALOG[model as BillingModel]
    : undefined
}
