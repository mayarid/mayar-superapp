# Laporan temuan API Mayar V2

Halo tim Mayar,

Kami membangun aplikasi contoh yang memakai delapan model billing Mayar dalam
satu web app. Selama pengerjaan kami mencatat perilaku API yang berbeda dari
dokumentasi, lengkap dengan respons asli dan cara mengulangnya.

Dua di antaranya menghalangi fitur dan kami tulis lebih dulu. Sisanya tidak
memblokir, hanya membuat integrasi lebih lama dipelajari.

**Akun yang dipakai**

- Produksi: `3f25daa0-bcc8-4ce4-a2b8-7dc73b0282b9`
- Sandbox: `ad732280-0509-45f3-932f-92a50c381052`

---

## 1. `/saas/v2` menolak API key yang diterima `/hl/v2`

**Lingkungan:** sandbox, `https://api.mayar.io`

API key yang sama berhasil di `/hl/v2`:

```
GET  /hl/v2/payment-channels   -> 200
POST /hl/v2/payments/create    -> 200
POST /hl/v2/coupons/validate   -> 200
```

Tetapi ditolak di `/saas/v2`:

```
POST /saas/v2/license/activate -> {"messages":"Failed authentication! Please check your token authorization."}
POST /saas/v2/license/verify   -> {"messages":"Failed authentication! Please check your token authorization."}
```

Header yang dikirim identik: `Authorization: Bearer <key>`.

Karena ini galat autentikasi, permintaannya ditolak sebelum kode lisensi
sempat diperiksa.

**Pertanyaan kami:** apakah endpoint lisensi memakai kredensial yang berbeda
dari API key biasa, atau dilayani dari host lain? Kami tidak menemukan
keterangannya di dokumentasi.

---

## 2. Seluruh grup `/hl/v2/credit/*` menjawab 404

**Lingkungan:** produksi dan sandbox, dua akun berbeda, hasil sama.

```
POST /hl/v2/credit/credit-usage/customer/regist -> 404 Not Found
POST /hl/v2/credit/generate/immutable/checkout  -> 404 Not Found
GET  /hl/v2/credit/balance                      -> 404 Not Found
```

Path diambil langsung dari halaman dokumentasi, dan `mayar-cli` resmi
menghasilkan 404 yang sama.

Yang sudah kami kesampingkan:

- **Bukan izin akun** — dua akun berbeda, dua lingkungan, hasil sama.
- **Bukan produk salah konfigurasi** — produk CREDIT dibuat dengan
  `creditValue`, `enableCreditTopup`, `minCreditTopup`, dan `maxCreditTopup`
  terisi, lalu terbaca kembali lengkap.
- **Bukan cara pembuatan produk** — dicoba dengan produk buatan API dan produk
  buatan dashboard, keduanya sama.

Produk yang sama terbaca normal lewat `mayar membership product get`:
`status: active`, `type: CREDIT`, dengan tier berharga Rp2.000 yang memberi
100 kredit.

**Pertanyaan kami:** apakah endpoint `/hl/v2/credit/*` sudah aktif? Jika
path-nya berbeda dari dokumentasi, path yang benar apa?

---

## 3. Catatan dokumentasi (tidak memblokir)

Temuan berikut tidak menghentikan pekerjaan, tetapi masing-masing sempat
membuat kami mencari cukup lama karena gagalnya tidak bersuara.

| Endpoint | Temuan |
| --- | --- |
| `POST /hl/v2/payment-links/{id}/update` | `name` ditandai opsional di dokumen, tetapi wajib. Untuk produk membership, `amount` juga wajib. |
| `POST /hl/v2/payment-links/{id}/update` | Permintaan yang gagal validasi tetap mengembalikan **HTTP 200** dengan `messages: "failed"`. Klien yang hanya memeriksa status HTTP akan menganggapnya berhasil. |
| `GET /hl/v2/transactions` | Isinya riwayat saldo, bukan daftar transaksi. ID transaksi ada di `paymentLinkTransactionId`, dan nominalnya bernama `credit`, bukan `amount`. |
| `GET /hl/v2/transactions` | `startAt` dan `endAt` diterima tetapi tidak berpengaruh. Permintaan dengan `startAt` esok hari mengembalikan halaman yang sama. |
| `GET /hl/v2/transactions` | Tanpa `status=paid`, halaman terisi baris `settled` lama dan pembayaran yang baru beberapa detik tidak muncul. |
| `POST /hl/v2/invoices/create` | `items[].rate` wajib positif, jadi diskon tidak bisa menjadi baris tersendiri. |
| `POST /hl/v2/installments/create` | `link` tiap termin berupa slug, bukan URL penuh seperti endpoint lain. |
| `GET /hl/v2/memberships/members` | Relasi dikembalikan sebagai kunci bertitik (`"customer.email"`), tidak bersarang seperti endpoint lain. |
| `POST /hl/v2/memberships/tiers/create` | `periods: [{}]` diterima dan menghasilkan tier tanpa harga, padahal galat sebelumnya menyatakan tier tanpa harga tidak bisa dijual. |
| `POST /hl/v2/coupons/validate` | Kupon yang terikat ke produk lain mengembalikan 404 dengan pesan yang sama persis dengan kupon yang tidak ada. |
| Sandbox | Tautan invoice dilayani dari `<merchant>.myr.lat`, sementara produk terdaftar di `<merchant>.mayar.shop`. |

Catatan lengkap beserta payload dan respons mentahnya ada di berkas
`api-findings.md` yang kami lampirkan. Satu temuan di sana (nomor 24) sudah
kami cabut sendiri setelah terbukti keliru — kami biarkan tertulis agar
jelas mana yang masih berlaku. Temuan 1–15 diuji di produksi, temuan 16 ke atas
sebagian di sandbox.

Terima kasih.
