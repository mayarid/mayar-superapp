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

/** Why a model has no coupon field, when it has none. */
export type CouponBlock = null | {
  reason: string
}

export interface DemoProduct {
  model: BillingModel
  /** Route segment under /billing. */
  slug: string
  /** Short label for the model itself. */
  label: string
  /** What the visitor sees this page selling. */
  title: string
  tagline: string
  /** Mayar product id. Also the paymentLinkId used to validate coupons. */
  productId: string
  price: Rupiah
  /** Coupon codes bound to this product in Mayar. */
  coupons: string[]
  /** Set when the API cannot apply a coupon on this model's path. */
  couponBlocked: CouponBlock
  /** Endpoint shown on the page, so the mechanics stay visible. */
  endpoint: string
  /** Bullet list of what the buyer receives. */
  includes: string[]
  /** One paragraph on the billing mechanics, shown on the page. */
  mechanics: string
  /** Set when the model cannot run at all yet, with the reason. */
  blocked?: string
}

const TIER_PRICED =
  "Model ini dijual lewat tier, dan endpoint tagihannya menghitung nominal dari tier itu tanpa menerima penimpaan. Kupon tidak bisa diterapkan di jalur ini — bukan karena tidak disediakan, tetapi karena API-nya memang tidak menerimanya."

export const CATALOG: Record<BillingModel, DemoProduct> = {
  "sekali-bayar": {
    model: "sekali-bayar",
    slug: "sekali-bayar",
    label: "Sekali bayar",
    title: "Template Notion Perencana Konten",
    tagline: "Satu berkas, sekali bayar, langsung dipakai.",
    productId: "d14287f3-3e94-4b20-9e7a-353b26edfcf2",
    price: LIST_PRICE,
    coupons: ["SEKALI50", "SEKALI1K"],
    couponBlocked: null,
    endpoint: "POST /hl/v2/payments/create",
    includes: [
      "Basis data Notion siap pakai",
      "Tampilan kalender, papan, dan tabel",
      "Panduan pemakaian singkat",
      "Pembaruan seumur hidup",
    ],
    mechanics:
      "Formulir checkout milik aplikasi ini sepenuhnya, termasuk kolom kode diskon. Server memanggil payments/create dengan nominal yang sudah didiskon, lalu membuka halaman pembayaran Mayar yang dikunci ke QRIS.",
  },

  fulfillment: {
    model: "fulfillment",
    slug: "sekali-bayar-fulfillment",
    label: "Sekali bayar + fulfillment",
    title: "Paket Ikon Antarmuka",
    tagline: "Sekali bayar, tautan unduhan terbit sendiri setelah lunas.",
    productId: "7999277b-eaf4-45c9-bd45-57c55e7bb6f8",
    price: LIST_PRICE,
    coupons: ["FULFILL50", "FULFILL1K"],
    couponBlocked: null,
    endpoint: "POST /hl/v2/payments/create, lalu signed URL dari R2",
    includes: [
      "240 ikon SVG",
      "Tiga bobot garis",
      "Berkas sumber Figma",
      "Lisensi pemakaian komersial",
    ],
    mechanics:
      "Penagihannya persis sama dengan sekali bayar. Yang berbeda hanya apa yang terjadi setelah lunas: aplikasi menerbitkan tautan unduhan R2 berumur 15 menit, dan hanya sekali — indeks unik di basis data yang menjaminnya, bukan logika program.",
  },

  invoice: {
    model: "invoice",
    slug: "invoice-berbutir",
    label: "Invoice berbutir",
    title: "Jasa Desain Per Proyek",
    tagline: "Tagihan dengan beberapa baris pekerjaan.",
    productId: "0df14920-464a-4345-847c-a9128d29660c",
    price: LIST_PRICE,
    coupons: ["INVOICE50", "INVOICE1K"],
    couponBlocked: null,
    endpoint: "POST /hl/v2/invoices/create",
    includes: [
      "Riset dan wireframe",
      "Desain antarmuka",
      "Satu putaran revisi",
    ],
    mechanics:
      "Invoice dikirim ke Mayar sebagai beberapa baris pekerjaan. Diskonnya tidak bisa jadi baris tersendiri, karena rate wajib positif — jadi diskon menurunkan rate tiap baris secara proporsional. Akibatnya diskon tidak terlihat sebagai baris terpisah di invoice Mayar.",
  },

  membership: {
    model: "membership",
    slug: "membership",
    label: "Membership",
    title: "Kelas Menulis Bulanan",
    tagline: "Langganan bulanan dengan tagihan per termin.",
    productId: "9b52b22e-1a0c-4fd7-b9c3-c66c234b83f5",
    price: LIST_PRICE,
    coupons: [],
    couponBlocked: { reason: TIER_PRICED },
    endpoint:
      "POST /hl/v2/memberships/members/create, lalu .../{memberId}/invoice/create",
    includes: [
      "Satu kelas langsung tiap pekan",
      "Umpan balik tertulis",
      "Arsip rekaman",
    ],
    mechanics:
      "Anggota didaftarkan lebih dulu, baru tagihan termin pertama diterbitkan. Tagihan itu idempoten per termin: memanggilnya lagi dalam periode yang sama mengembalikan tagihan yang belum dibayar, bukan membuat tagihan kedua.",
  },

  kredit: {
    model: "kredit",
    slug: "dompet-kredit",
    label: "Dompet kredit",
    title: "Asisten AI Berbasis Kredit",
    tagline: "Beli kredit, terpotong tiap permintaan.",
    productId: "f90cbbbd-d5e1-48a2-b591-20489fa1f5c0",
    price: LIST_PRICE,
    coupons: [],
    couponBlocked: { reason: TIER_PRICED },
    endpoint: "POST /hl/v2/credit/generate/immutable/checkout",
    includes: ["100 kredit", "1 kredit per permintaan", "Saldo tidak hangus"],
    mechanics:
      "Checkout kredit mengembalikan tautan saja, tanpa nomor transaksi, jadi pencocokan pembayarannya bersandar pada email pembeli dalam jendela waktu.",
    blocked:
      "Seluruh grup endpoint /hl/v2/credit/* menjawab 404 di akun ini, walau produknya terbaca aktif dan bertipe CREDIT. Fitur dompet kredit tampaknya belum dibuka untuk merchant ini.",
  },

  saas: {
    model: "saas",
    slug: "lisensi-saas",
    label: "Lisensi SaaS",
    title: "Aplikasi Desktop Berlisensi",
    tagline: "Lisensi diaktifkan dengan kode.",
    productId: "8137866c-72d5-4b4d-891b-921d66916ee3",
    price: LIST_PRICE,
    coupons: [],
    couponBlocked: { reason: TIER_PRICED },
    endpoint: "POST /saas/v2/license/activate dan /verify",
    includes: [
      "Satu kode lisensi",
      "Aktivasi di satu perangkat",
      "Pemeriksaan lisensi daring",
    ],
    mechanics:
      "Ini satu-satunya model yang endpointnya berada di /saas/v2, bukan /hl/v2. Dokumentasi tidak menyebutkan dari mana kode lisensi pertama kali terbit, jadi halaman ini mencarinya di transaksi dan mengatakan terus terang bila tidak menemukannya.",
  },

  qris: {
    model: "qris",
    slug: "qris-dinamis",
    label: "QRIS dinamis",
    title: "Kasir Kedai Kopi",
    tagline: "QRIS on-demand, dipindai langsung di tempat.",
    productId: "d901cbe2-9a29-4146-9113-24aebc840fb5",
    price: LIST_PRICE,
    coupons: ["QRIS50", "QRIS1K"],
    couponBlocked: null,
    endpoint: "POST /hl/v2/qr-codes/create",
    includes: ["Satu gelas kopi susu", "Diminum di tempat"],
    mechanics:
      "Satu-satunya model yang QR-nya benar-benar ditampilkan di aplikasi ini. Permintaannya hanya berisi nominal dan responsnya tidak membawa nomor apa pun, jadi nominal itu sendiri yang dijadikan penanda pesanan — lewat kode unik, kebiasaan lama e-commerce Indonesia.",
  },

  cicilan: {
    model: "cicilan",
    slug: "cicilan",
    label: "Cicilan",
    title: "Kursus Daring Berbayar Cicil",
    tagline: "Bayar bertahap selama tiga bulan.",
    productId: "c19b9bd6-974e-4f59-b170-37ea032f5c01",
    // Higher than the others on purpose: the total is split across terms, and
    // every term still has to clear the Rp1.000 floor.
    price: 6000,
    coupons: ["CICILAN50", "CICILAN1K"],
    couponBlocked: null,
    endpoint: "POST /hl/v2/installments/create",
    includes: [
      "Dua belas modul video",
      "Berkas latihan",
      "Sertifikat penyelesaian",
    ],
    mechanics:
      "Tenor wajib antara 3 dan 24 bulan, jadi harga daftarnya dinaikkan supaya tiap termin tetap di atas lantai Rp1.000. Mayar mengembalikan satu tagihan per termin, masing-masing dengan tautan bayarnya sendiri.",
  },
}

/** Membership tiers, needed by the models that sell through a tier. */
export const TIERS = {
  membership: "7ce53f2a-b055-4a18-a04e-0eaabb3c2151",
  kredit: "47a680f9-414b-4e93-822e-899f2dae0ffc",
  saas: "d1db3f30-550d-4881-9eb0-c535559f55eb",
} as const

/** How many wallet units the credit tier grants per purchase. */
export const CREDIT_PER_PURCHASE = 100

/** Instalment terms. Mayar requires a tenure of 3 to 24 months. */
export const INSTALLMENT_TENURE = 3
export const INSTALLMENT_DUE_DAY = 10

/** Line items sent to invoices/create, before any discount is spread. */
export const INVOICE_ITEMS = [
  { quantity: 1, rate: 1000, description: "Riset dan wireframe" },
  { quantity: 1, rate: 700, description: "Desain antarmuka" },
  { quantity: 1, rate: 300, description: "Satu putaran revisi" },
]

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
