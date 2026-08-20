import type { BillingModel } from "./catalog"

/**
 * Page copy, kept apart from catalog.ts on purpose.
 *
 * catalog.ts is what the server charges — prices, product ids, the reasons a
 * model is blocked. This file is only what a reader sees. Splitting them means
 * marketing copy can be rewritten without touching anything the checkout
 * depends on, and a price is never quoted from two places at once. Where copy
 * needs a number, the page formats it from the catalog at render time instead
 * of repeating it here.
 */

export interface MarketingItem {
  title: string
  body: string
}

export interface MarketingFaq {
  question: string
  answer: string
}

export interface MarketingContent {
  /** Short label above the headline. */
  eyebrow: string
  /** The promise, not the product name. */
  headline: string
  /** One sentence, held to roughly a 62-character measure. */
  subheadline: string
  /** Three claims for the strip under the hero. */
  proofPoints: MarketingItem[]
  /** How the billing actually runs, in order. */
  steps: MarketingItem[]
  /** Named limits included on purpose, not only the flattering parts. */
  faq: MarketingFaq[]
  closing: { heading: string; body: string }
}

/**
 * Written out rather than built from the slug, because the router types each
 * route path as a literal and a template string would not satisfy them.
 */
export const HREF = {
  "sekali-bayar": "/billing/sekali-bayar",
  fulfillment: "/billing/sekali-bayar-fulfillment",
  invoice: "/billing/invoice-berbutir",
  membership: "/billing/membership",
  kredit: "/billing/dompet-kredit",
  saas: "/billing/lisensi-saas",
  qris: "/billing/qris-dinamis",
  cicilan: "/billing/cicilan",
} as const satisfies Record<BillingModel, string>

export const MARKETING: Record<BillingModel, MarketingContent> = {
  "sekali-bayar": {
    eyebrow: "Sekali bayar",
    headline: "Jual satu berkas, terima uangnya hari ini",
    subheadline:
      "Satu tautan bayar, satu harga, tanpa langganan yang harus diurus kemudian.",
    proofPoints: [
      {
        title: "Checkout milik sendiri",
        body: "Nama, email, dan kode diskon diisi di halaman ini, bukan di halaman Mayar.",
      },
      {
        title: "QRIS lebih dulu",
        body: "Halaman pembayaran dikunci ke QRIS, jadi pembeli tidak perlu memilih apa pun.",
      },
      {
        title: "Kupon berlaku",
        body: "Diskon dihitung di server sebelum tagihan dikirim, bukan dipotong di layar.",
      },
    ],
    steps: [
      {
        title: "Pembeli mengisi formulir",
        body: "Tiga kolom dan satu kode diskon opsional. Kode diperiksa ke Mayar sebelum tombol bayar ditekan.",
      },
      {
        title: "Server membuat tagihan",
        body: "Aplikasi memanggil payments/create dengan nominal yang sudah didiskon. Harga diambil dari katalog server, bukan dari permintaan.",
      },
      {
        title: "Halaman ini menunggu",
        body: "Tab pembayaran terbuka terpisah. Tab ini tetap memantau pesanan dan berpindah sendiri ke struk begitu uangnya masuk.",
      },
    ],
    faq: [
      {
        question: "Kenapa checkoutnya tidak langsung ke halaman Mayar?",
        answer:
          "Supaya kolom yang dilihat pembeli bisa diatur sendiri, termasuk kode diskon. Halaman Mayar hanya dipakai di langkah terakhir, saat uangnya dibayar.",
      },
      {
        question: "Apakah harga bisa diubah dari sisi pembeli?",
        answer:
          "Tidak. Permintaan checkout hanya menyebut nama model. Server yang mencari harganya, jadi permintaan yang diubah-ubah tidak bisa menurunkan nominal yang ditagih.",
      },
      {
        question: "Bagaimana kalau tab pembayaran tertutup?",
        answer:
          "Pesanan terakhir disimpan di peramban. Panel lanjutkan pesanan di halaman ini akan membawamu kembali ke struk yang benar.",
      },
      {
        question: "Apakah ini memakai webhook?",
        answer:
          "Tidak. Status pembayaran diketahui dengan menanyai Mayar dari satu durable object, sekali tiap lima detik untuk semua pesanan sekaligus, karena seluruh aplikasi berbagi jatah lima puluh permintaan per menit.",
      },
    ],
    closing: {
      heading: "Siap menagih sekali bayar?",
      body: "Isi formulirnya, bayar dengan QRIS, dan lihat sendiri strukmu terbit.",
    },
  },

  fulfillment: {
    eyebrow: "Sekali bayar + fulfillment",
    headline: "Lunas, lalu berkasnya terbit sendiri",
    subheadline:
      "Penagihan sama dengan sekali bayar. Yang berbeda hanya apa yang terjadi setelahnya.",
    proofPoints: [
      {
        title: "Tautan berumur 15 menit",
        body: "Setelah lunas, aplikasi menerbitkan signed URL dari R2 yang kedaluwarsa sendiri.",
      },
      {
        title: "Sekali terbit, sekali saja",
        body: "Indeks unik di basis data yang menjamin, bukan logika program yang bisa dilewati.",
      },
      {
        title: "Tanpa surel penyerahan",
        body: "Berkas muncul di halaman struk saat itu juga, jadi tidak ada kotak masuk yang perlu ditunggu.",
      },
    ],
    steps: [
      {
        title: "Bayar seperti biasa",
        body: "Jalur tagihannya persis sekali bayar: payments/create, halaman QRIS, satu nominal.",
      },
      {
        title: "Pembayaran tercatat lunas",
        body: "Durable object yang memantau pesanan menandai pesanan lunas begitu Mayar mengonfirmasi.",
      },
      {
        title: "Tautan unduhan terbit",
        body: "Aplikasi menandatangani satu URL R2 untuk pesanan itu dan menaruhnya di struk. Memuat ulang halaman tidak menerbitkan tautan kedua.",
      },
    ],
    faq: [
      {
        question: "Apa bedanya dengan sekali bayar biasa?",
        answer:
          "Tidak ada bedanya di sisi penagihan. Bedanya hanya penyerahan berkas: model ini punya langkah tambahan setelah pembayaran lunas.",
      },
      {
        question:
          "Bagaimana kalau tautannya kedaluwarsa sebelum sempat diunduh?",
        answer:
          "Buka kembali struk pesananmu. Halaman itu tetap mengenali pesanan yang sudah lunas dan menerbitkan tautan baru untuk pemilik pesanan.",
      },
      {
        question: "Apakah tautannya bisa dibagikan ke orang lain?",
        answer:
          "Secara teknis bisa selama 15 menit itu. Setelah lewat, tautan mati dengan sendirinya — itulah gunanya masa berlaku sependek ini.",
      },
      {
        question: "Kupon berlaku di model ini?",
        answer:
          "Berlaku. Model ini memakai jalur payments/create yang menerima nominal, jadi diskon dihitung di server sebelum tagihan dikirim.",
      },
    ],
    closing: {
      heading: "Lihat penyerahan otomatisnya",
      body: "Bayar sekali, lalu perhatikan tautan unduhannya muncul di halaman struk.",
    },
  },

  invoice: {
    eyebrow: "Invoice berbutir",
    headline: "Tagihan yang memperlihatkan pekerjaannya",
    subheadline:
      "Beberapa baris pekerjaan dalam satu tagihan, bukan satu angka gelondongan.",
    proofPoints: [
      {
        title: "Tiga baris pekerjaan",
        body: "Riset, desain, dan revisi dikirim sebagai baris terpisah ke invoices/create.",
      },
      {
        title: "Diskon menyebar",
        body: "Rate wajib positif, jadi diskon menurunkan tiap baris secara proporsional.",
      },
      {
        title: "Batas yang ditampilkan",
        body: "Akibatnya diskon tidak terlihat sebagai baris tersendiri di invoice Mayar. Itu disebutkan, bukan disembunyikan.",
      },
    ],
    steps: [
      {
        title: "Baris disusun di server",
        body: "Daftar pekerjaan ditetapkan di katalog aplikasi, bukan dikirim dari peramban.",
      },
      {
        title: "Diskon dibagi rata menurut bobot",
        body: "Satu potongan dibagikan ke semua baris sesuai nilainya, supaya jumlahnya tetap cocok dan tidak ada rate yang jatuh ke nol.",
      },
      {
        title: "Invoice terbit di Mayar",
        body: "Pembeli menerima satu tagihan dengan rinciannya, dan membayarnya lewat halaman QRIS.",
      },
    ],
    faq: [
      {
        question: "Kenapa diskonnya tidak jadi baris sendiri?",
        answer:
          "Karena endpoint invoice menolak rate negatif. Satu-satunya cara menurunkan total adalah menurunkan rate tiap baris, dan itulah yang dilakukan aplikasi ini.",
      },
      {
        question: "Apakah jumlah barisnya bisa diubah pembeli?",
        answer:
          "Tidak. Baris pekerjaan dan tarifnya milik server. Permintaan checkout hanya menyebut model dan kode diskon.",
      },
      {
        question: "Bagaimana pembulatannya?",
        answer:
          "Potongan dibagi menurut bobot tiap baris, lalu sisa pembulatan ditaruh di baris terbesar supaya total tagihan tetap sama persis dengan yang dijanjikan.",
      },
      {
        question: "Apakah tiap baris ditagih terpisah?",
        answer:
          "Tidak. Semua baris berada dalam satu invoice dan dibayar sekali. Yang terpisah per termin adalah model cicilan.",
      },
    ],
    closing: {
      heading: "Terbitkan invoice berbutir",
      body: "Isi datamu, pakai kode diskon, dan lihat bagaimana potongannya menyebar.",
    },
  },

  membership: {
    eyebrow: "Membership",
    headline: "Langganan yang menagih tiap termin",
    subheadline:
      "Anggota didaftarkan lebih dulu, tagihannya menyusul per periode.",
    proofPoints: [
      {
        title: "Dua langkah, bukan satu",
        body: "Daftarkan anggota, baru terbitkan tagihan termin pertama.",
      },
      {
        title: "Idempoten per termin",
        body: "Memanggil ulang dalam periode yang sama mengembalikan tagihan yang belum dibayar, bukan tagihan kedua.",
      },
      {
        title: "Dijual lewat tier",
        body: "Nominalnya dihitung dari tier, jadi jalur ini memang tidak menerima kupon.",
      },
    ],
    steps: [
      {
        title: "Anggota dibuat",
        body: "memberships/members/create mendaftarkan pembeli ke tier yang dipilih.",
      },
      {
        title: "Tagihan termin diterbitkan",
        body: "Panggilan kedua ke invoice/create membuat tagihan untuk periode berjalan.",
      },
      {
        title: "Periode berikutnya menyusul",
        body: "Termin berikutnya menerbitkan tagihannya sendiri. Satu periode tidak pernah punya dua tagihan terbuka.",
      },
    ],
    faq: [
      {
        question: "Kenapa kode diskon tidak bisa dipakai di sini?",
        answer:
          "Karena model ini dijual lewat tier, dan endpoint tagihannya menghitung nominal dari tier itu tanpa menerima penimpaan. Bukan karena kuponnya tidak disediakan, tetapi karena API-nya memang tidak menerimanya.",
      },
      {
        question: "Apa yang terjadi kalau tombol bayar ditekan dua kali?",
        answer:
          "Tagihan yang sama dikembalikan. Aplikasi tidak membuat tagihan kedua untuk periode yang sedang berjalan.",
      },
      {
        question: "Apakah langganannya berhenti sendiri?",
        answer:
          "Tidak ada penarikan otomatis di sini. Tiap termin menerbitkan tagihannya sendiri, jadi berhenti berarti berhenti membayar tagihan berikutnya.",
      },
      {
        question: "Kenapa perlu dua panggilan API?",
        answer:
          "Keanggotaan dan tagihan adalah dua hal berbeda di Mayar. Anggota harus ada lebih dulu sebelum ada yang bisa ditagih atas namanya.",
      },
    ],
    closing: {
      heading: "Daftar dan tagih termin pertama",
      body: "Isi datamu, lalu perhatikan dua panggilan itu berjalan berurutan.",
    },
  },

  kredit: {
    eyebrow: "Dompet kredit",
    headline: "Beli kredit, pakai sesuai kebutuhan",
    subheadline:
      "Saldo terpotong tiap permintaan, dan tidak hangus saat bulan berganti.",
    proofPoints: [
      {
        title: "Seratus kredit sekali beli",
        body: "Satu kredit untuk satu permintaan, dihitung dari tier.",
      },
      {
        title: "Saldo tidak hangus",
        body: "Sisa kredit tetap ada sampai dipakai, tanpa masa berlaku bulanan.",
      },
      {
        title: "Belum bisa dijalankan",
        body: "Seluruh grup endpoint kredit menjawab 404. Halaman ini tetap menampilkannya apa adanya.",
      },
    ],
    steps: [
      {
        title: "Checkout kredit dibuat",
        body: "credit/generate/immutable/checkout dipanggil dengan tier yang menentukan jumlah kredit.",
      },
      {
        title: "Responsnya hanya tautan",
        body: "Tidak ada nomor transaksi yang dikembalikan, jadi pencocokan pembayaran bersandar pada email pembeli dalam jendela waktu.",
      },
      {
        title: "Saldo terisi setelah lunas",
        body: "Kredit masuk ke dompet pembeli dan terpotong tiap permintaan yang dilayani.",
      },
    ],
    faq: [
      {
        question: "Kenapa model ini tidak bisa dibayar sekarang?",
        answer:
          "Seluruh grup endpoint kredit menjawab 404 — di produksi maupun sandbox, di dua akun berbeda, termasuk pada produk yang dibuat lewat dashboard. Jadi ini bukan soal izin akun. Entah path-nya belum di-deploy, entah berbeda dari yang dipakai dokumen dan CLI resmi.",
      },
      {
        question: "Kenapa halamannya tetap ditampilkan?",
        answer:
          "Karena model ini bagian dari peta cara menagih, dan batas yang ditemukan lebih berguna kalau ditulis daripada dihapus dari daftar.",
      },
      {
        question: "Kenapa pencocokan pembayarannya bersandar pada email?",
        answer:
          "Karena checkout kredit hanya mengembalikan tautan, tanpa nomor transaksi yang bisa dipegang. Tanpa penanda, yang tersisa hanya email pembeli dan jendela waktu.",
      },
      {
        question: "Apakah kode diskon berlaku di sini?",
        answer:
          "Tidak. Sama seperti membership dan lisensi, model ini dijual lewat tier dan nominalnya dihitung dari tier tanpa menerima penimpaan.",
      },
    ],
    closing: {
      heading: "Model ini belum bisa dibayar",
      body: "Formulirnya tetap ditampilkan supaya jalurnya terlihat, tetapi tombolnya dimatikan.",
    },
  },

  saas: {
    eyebrow: "Lisensi SaaS",
    headline: "Satu kode, satu perangkat, sekali aktivasi",
    subheadline:
      "Lisensi diaktifkan dengan kode, lalu diperiksa lagi setiap kali dipakai.",
    proofPoints: [
      {
        title: "Aktivasi dan verifikasi",
        body: "Dua endpoint terpisah: satu mengikat kode ke perangkat, satu memeriksanya kemudian.",
      },
      {
        title: "Jalur API yang berbeda",
        body: "Satu-satunya model yang endpointnya berada di /saas/v2, bukan /hl/v2.",
      },
      {
        title: "Asal kode disebut terus terang",
        body: "Dokumentasi tidak menyebutkan dari mana kode pertama kali terbit, jadi halaman ini mencarinya di transaksi.",
      },
    ],
    steps: [
      {
        title: "Lisensi dibeli",
        body: "Pembelian berjalan lewat tier, sama seperti membership dan kredit.",
      },
      {
        title: "Kode diaktifkan",
        body: "license/activate mengikat kode ke satu perangkat. Panel di halaman ini memanggilnya langsung.",
      },
      {
        title: "Lisensi diperiksa",
        body: "license/verify menjawab apakah kode itu masih berlaku, dan halaman ini menampilkan jawabannya apa adanya.",
      },
    ],
    faq: [
      {
        question: "Dari mana kode lisensinya datang?",
        answer:
          "Dokumentasi tidak menyebutkannya. Aplikasi ini mencarinya di transaksi setelah pembelian, dan mengatakan terus terang bila tidak menemukannya alih-alih menampilkan kode palsu.",
      },
      {
        question: "Bisa dipakai di berapa perangkat?",
        answer:
          "Satu. Aktivasi mengikat kode ke perangkat yang mengaktifkannya.",
      },
      {
        question: "Kenapa endpointnya berbeda dari model lain?",
        answer:
          "Lisensi berada di /saas/v2 sementara tujuh model lain memakai /hl/v2. Perbedaan ini nyata dan berpengaruh pada cara aplikasi memanggilnya.",
      },
      {
        question: "Kode diskon berlaku?",
        answer:
          "Tidak. Model ini dijual lewat tier, dan endpoint tagihannya menghitung nominal dari tier tanpa menerima penimpaan.",
      },
    ],
    closing: {
      heading: "Beli lalu aktifkan lisensinya",
      body: "Panel aktivasi di halaman ini memanggil endpoint yang sebenarnya, bukan tiruan.",
    },
  },

  qris: {
    eyebrow: "QRIS dinamis",
    headline: "Kode QR yang digambar di halaman ini",
    subheadline: "Pembeli memindai di tempat, tanpa berpindah ke halaman lain.",
    proofPoints: [
      {
        title: "QR tampil di aplikasi",
        body: "Satu-satunya model yang kode QR-nya benar-benar digambar di sini, bukan di halaman Mayar.",
      },
      {
        title: "Nominal jadi penanda",
        body: "Responsnya tidak membawa nomor apa pun, jadi nominal diberi kode unik untuk membedakan pesanan.",
      },
      {
        title: "Kebiasaan yang sudah dikenal",
        body: "Kode unik di ujung nominal adalah cara lama e-commerce Indonesia, dipakai di sini karena memang cocok.",
      },
    ],
    steps: [
      {
        title: "Nominal diberi kode unik",
        body: "Beberapa rupiah terakhir dijadikan penanda pesanan, karena tidak ada nomor transaksi yang bisa dipegang.",
      },
      {
        title: "QR dibuat lalu digambar",
        body: "qr-codes/create hanya menerima nominal. Gambarnya ditampilkan langsung di halaman struk.",
      },
      {
        title: "Pembayaran dicocokkan",
        body: "Pemantau pesanan mencari pembayaran dengan nominal persis itu, lalu menandai pesanan lunas.",
      },
    ],
    faq: [
      {
        question: "Kenapa nominal yang saya bayar sedikit berbeda?",
        answer:
          "Beberapa rupiah terakhir adalah kode unik pesananmu. Itulah yang membedakan pembayaranmu dari pembayaran orang lain dengan harga yang sama.",
      },
      {
        question: "Kenapa tidak dibuka di tab baru seperti model lain?",
        answer:
          "Karena model ini mengembalikan gambar QR, bukan halaman pembayaran. Tidak ada yang perlu dibuka di tempat lain.",
      },
      {
        question: "Berapa lama QR-nya berlaku?",
        answer:
          "Halaman struk memantau pesanan selama masih terbuka. Bila kedaluwarsa, statusnya berubah dan kamu bisa memulai pesanan baru.",
      },
      {
        question: "Bagaimana kalau saya bayar dengan nominal yang dibulatkan?",
        answer:
          "Pembayaran tidak akan cocok dengan pesananmu. Bayar persis sejumlah yang tertera, sampai rupiah terakhir.",
      },
    ],
    closing: {
      heading: "Pindai dan bayar di tempat",
      body: "Kode QR-nya muncul di halaman berikutnya, tanpa tab tambahan.",
    },
  },

  cicilan: {
    eyebrow: "Cicilan",
    headline: "Bayar bertahap selama tiga bulan",
    subheadline: "Satu pembelian dipecah jadi tiga tagihan dengan jatuh tempo.",
    proofPoints: [
      {
        title: "Tiga termin",
        body: "Mayar mengembalikan satu tagihan per termin, masing-masing dengan tautan bayarnya sendiri.",
      },
      {
        title: "Tenor 3 sampai 24 bulan",
        body: "Batas itu milik API. Halaman ini memakai tenor terpendek yang diizinkan.",
      },
      {
        title: "Harga daftar dinaikkan",
        body: "Tiap termin harus tetap di atas lantai seribu rupiah, jadi totalnya dibuat lebih tinggi dari model lain.",
      },
    ],
    steps: [
      {
        title: "Cicilan dibuat",
        body: "installments/create dipanggil dengan tenor tiga bulan dan tanggal jatuh tempo tetap.",
      },
      {
        title: "Tiga tagihan terbit sekaligus",
        body: "Bukan satu tagihan yang dipecah kemudian. Ketiganya ada sejak awal, dengan tautannya masing-masing.",
      },
      {
        title: "Termin pertama dibayar",
        body: "Sisanya menunggu jatuh temponya sendiri. Tiap termin berdiri sendiri sebagai tagihan.",
      },
    ],
    faq: [
      {
        question: "Kenapa harganya lebih tinggi dari model lain?",
        answer:
          "Karena totalnya dibagi tiga, dan tiap termin masih harus melewati lantai seribu rupiah yang berlaku di semua tagihan. Harga daftarnya dinaikkan supaya pembagian itu sah.",
      },
      {
        question: "Kenapa tenornya tiga bulan?",
        answer:
          "Tenor wajib antara 3 dan 24 bulan. Tiga adalah yang terpendek, dan itu yang dipakai di sini supaya demo tidak berjalan bertahun-tahun.",
      },
      {
        question: "Apakah termin berikutnya ditarik otomatis?",
        answer:
          "Tidak. Tiap termin punya tautan bayarnya sendiri dan dibayar sendiri-sendiri.",
      },
      {
        question: "Kode diskon berlaku?",
        answer:
          "Berlaku. Diskon diterapkan pada total sebelum cicilan dibuat, lalu total itu yang dibagi ke tiga termin.",
      },
    ],
    closing: {
      heading: "Mulai cicilan tiga bulan",
      body: "Termin pertama dibayar sekarang, dua sisanya menunggu jatuh temponya.",
    },
  },
}

export function getMarketing(model: BillingModel): MarketingContent {
  return MARKETING[model]
}
