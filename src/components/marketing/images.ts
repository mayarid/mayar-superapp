/**
 * Photography for the landing pages.
 *
 * Every photo is hosted on Unsplash and hotlinked from their image CDN, which
 * is how Unsplash intends its photos to be served. The Unsplash Licence covers
 * commercial use without attribution.
 *
 * `unsplash()` appends the CDN's own resizing parameters, so each slot asks for
 * roughly the width it renders at instead of pulling a full-resolution file.
 * `auto=format` lets the CDN serve AVIF or WebP where the browser accepts it.
 *
 * Alt text sits beside the URL on purpose. A photo and its description drift
 * apart the moment they live in different files, and a wrong alt is worse than
 * none.
 */

export interface Photo {
  src: string
  alt: string
}

/** Widths chosen per slot; a card does not need a hero-sized file. */
type Width = 800 | 1200 | 1600

function unsplash(id: string, alt: string, width: Width = 1200): Photo {
  return {
    src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`,
    alt,
  }
}

export const PHOTO = {
  /** Sekali bayar — a planner, which is what the template being sold is. */
  planner: unsplash(
    "photo-1506784983877-45594efa4cbe",
    "Cangkir kopi di atas perencana bulanan yang terbuka",
    1600
  ),

  /** Fulfillment — the icon set, then the files it ships as. */
  iconKit: unsplash(
    "photo-1772272935464-2e90d8218987",
    "Layar laptop menampilkan beberapa varian gaya tombol antarmuka"
  ),
  designFiles: unsplash(
    "photo-1572044162444-ad60f128bdea",
    "Tablet gambar dan kartu warna di meja seorang desainer"
  ),
  timer: unsplash(
    "photo-1513544705284-99373737fab6",
    "Penghitung waktu mekanis di atas meja kayu",
    800
  ),
  singleKey: unsplash(
    "photo-1666960390180-e669a3f79336",
    "Satu kunci kuningan di atas permukaan gelap",
    800
  ),

  /** Invoice — the desk where a bill gets put together. */
  invoiceDesk: unsplash(
    "photo-1762427354566-2b6902a9fd06",
    "Meja kerja dengan kalkulator, pena, dan amplop",
    1600
  ),

  /** Membership — a class, then the work between classes. */
  writingClass: unsplash(
    "photo-1503428593586-e225b39bddfe",
    "Beberapa orang duduk menulis di buku catatan saat kelas berlangsung",
    1600
  ),
  writingDesk: unsplash(
    "photo-1434030216411-0b793f4b4173",
    "Seseorang menulis di buku catatan di meja kayu"
  ),

  /** SaaS — the licensed application, and the work it is licensed for. */
  licensedApp: unsplash(
    "photo-1541807084-5c52b6b3adef",
    "Laptop terbuka di atas meja kayu",
    1600
  ),
  codeScreen: unsplash(
    "photo-1498050108023-c5249f4df085",
    "Laptop menampilkan baris kode di meja kerja"
  ),

  /** QRIS — the counter, the code, and the amount that identifies the order. */
  coffeeCounter: unsplash(
    "photo-1508766917616-d22f3f1eea14",
    "Pembeli membayar kopi di meja kasir kedai",
    1600
  ),
  qrOnPhone: unsplash(
    "photo-1595079676339-1534801ad6cf",
    "Ponsel menampilkan kode QR untuk dipindai",
    800
  ),
  priceLabel: unsplash(
    "photo-1558274849-f9fa5f16dee8",
    "Papan harga kopi tertulis tangan di kedai",
    800
  ),

  /** Cicilan — the course being paid for over three terms. */
  onlineCourse: unsplash(
    "photo-1513258496099-48168024aec0",
    "Seseorang berheadphone mengikuti kursus daring di depan laptop",
    1600
  ),
} as const
