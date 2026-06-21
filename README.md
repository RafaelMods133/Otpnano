# Sinyal — Platform Nomor Virtual (Nokos)

Web aplikasi untuk pembelian nomor virtual (nokos) dari berbagai negara
untuk verifikasi OTP (WhatsApp, Telegram, dll), dengan sistem deposit
saldo otomatis lewat QRIS.

Dibangun dengan Next.js 16 (App Router), Supabase (database + auth),
dan siap deploy langsung ke Vercel.

## Fitur utama

- Landing page dengan daftar negara, layanan, dan produk best seller
  (default: Indonesia + WhatsApp)
- Autentikasi user (daftar/login) via Supabase Auth
- Deposit saldo lewat QRIS statis dengan kode unik otomatis, sehingga
  callback dari payment gateway bisa mencocokkan pembayaran tanpa
  konfirmasi manual
- Endpoint callback QRIS sesuai dokumentasi SMP Payment (validasi key
  rahasia, validasi username, anti duplikasi RRN, response code standar)
- Pembelian nomor virtual dengan debit saldo atomic (anti saldo negatif)
- Titik integrasi tunggal untuk provider OTP "Rumah OTP" — tinggal isi
  satu file begitu API key/dokumentasi resminya diterima
- Auto-refund saldo jika nomor gagal didapat atau OTP tidak masuk
  sebelum waktu habis
- Riwayat deposit dan transaksi per user

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Masuk ke **SQL Editor**, lalu jalankan seluruh isi file
   `supabase/schema.sql` dari project ini. File ini membuat semua tabel,
   Row Level Security, RPC atomic untuk saldo, trigger, dan data awal
   (10 negara + 8 layanan).
3. Masuk ke **Project Settings > API**, salin tiga nilai berikut untuk
   dipakai di environment variables:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan
     pernah expose ke browser)
4. (Opsional) Di **Authentication > Email**, sesuaikan template email
   konfirmasi pendaftaran sesuai branding Anda.

## 2. Setup QRIS (deposit otomatis)

Sistem ini menggunakan **QRIS statis** (1 QR untuk semua user) dengan
kode unik 3 digit yang ditambahkan ke nominal yang diminta user, supaya
setiap transfer punya nominal berbeda dan bisa dicocokkan otomatis oleh
callback — tanpa user perlu mengisi referensi manual.

1. Dapatkan string mentah QRIS statis Anda. Cara mendapatkannya: scan QR
   fisik/gambar QRIS Anda dengan aplikasi pembaca QR apa saja yang bisa
   menampilkan teks mentahnya (formatnya string EMV QRIS, biasanya
   dimulai dengan `00020101...`). Masukkan ke `QRIS_STATIC_CONTENT`.
2. Buat secret key acak yang panjang untuk URL callback, contoh:
   ```bash
   openssl rand -hex 32
   ```
   Masukkan ke `QRIS_CALLBACK_SECRET`.
3. Isi `QRIS_MERCHANT_USERNAME` dengan username akun SMP Payment Anda
   (harus sama persis dengan field `us_username` yang dikirim di payload
   callback).
4. Di dashboard SMP Payment (Pengaturan QRIS > Dokumentasi API),
   daftarkan URL callback Anda dengan format:
   ```
   https://domainanda.com/api/callback/qris/{QRIS_CALLBACK_SECRET}
   ```
   Ganti `{QRIS_CALLBACK_SECRET}` dengan nilai asli yang Anda buat di
   langkah 2 (bukan literal teks ini).

### Cara kerja pencocokan otomatis

Saat user minta deposit Rp 50.000, sistem menambahkan kode unik acak
(100 sampai 998) sehingga nominal yang harus ditransfer misal jadi
Rp 50.347. Setiap kombinasi nominal ini dijaga unik di database selama
statusnya masih *pending*. Begitu callback masuk dari SMP Payment
dengan `amount.value` yang cocok, saldo user otomatis ditambahkan lewat
fungsi database atomic (`credit_deposit`), dan RRN disimpan untuk
mencegah callback yang sama diproses dua kali.

## 3. Setup provider OTP "Rumah OTP"

Integrasi ke provider OTP sengaja dipisah ke satu file saja:

```
src/lib/otp-provider/rumahotp.ts
```

File ini berisi 5 fungsi placeholder (`orderNumber`, `checkOtpStatus`,
`cancelOrder`, `listAvailableCountries`, `listAvailableServices`) dengan
kontrak/tipe data yang sudah dipakai konsisten di seluruh aplikasi.
Begitu Anda menerima dokumentasi resmi dan API key dari Rumah OTP:

1. Isi `RUMAHOTP_API_KEY` dan `RUMAHOTP_BASE_URL` di environment
   variables.
2. Ganti isi badan tiap fungsi di file tersebut dengan pemanggilan
   endpoint resmi mereka sesuai dokumentasinya. Seluruh route handler
   lain (`/api/orders`, `/api/orders/[id]/status`,
   `/api/orders/[id]/cancel`) sudah memanggil fungsi-fungsi ini, jadi
   tidak ada bagian lain yang perlu diubah.
3. Sesuaikan tabel `products` di Supabase: kolom
   `provider_country_code` dan `provider_service_code` harus diisi
   sesuai kode yang dipakai provider (lihat fungsi
   `listAvailableCountries` / `listAvailableServices` untuk membantu
   sinkronisasi data ini).

## 4. Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local
# isi semua nilai di .env.local sesuai langkah 1-3 di atas
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## 5. Deploy ke Vercel

1. Push project ini ke repository GitHub/GitLab/Bitbucket Anda.
2. Buka [vercel.com/new](https://vercel.com/new) dan import repository
   tersebut. Vercel akan otomatis mendeteksi ini sebagai project
   Next.js — tidak perlu konfigurasi build khusus.
3. Di tab **Environment Variables**, masukkan seluruh variabel yang
   ada di `.env.example` dengan nilai sebenarnya.
4. Klik **Deploy**.
5. Setelah live, update URL callback di dashboard SMP Payment dengan
   domain Vercel Anda (atau custom domain jika sudah disambungkan):
   ```
   https://nama-project-anda.vercel.app/api/callback/qris/{QRIS_CALLBACK_SECRET}
   ```

## 6. Mengelola produk (negara, layanan, harga, stok)

Saat ini pengelolaan katalog produk dilakukan langsung lewat **Table
Editor** di dashboard Supabase, pada tabel `countries`, `services`, dan
`products`. Untuk menjadikan kombinasi tertentu tampil di section
"Best Seller" pada homepage, set `is_best_seller = true` pada baris
produk tersebut di tabel `products` (secara default sudah disiapkan
untuk Indonesia + WhatsApp begitu Anda menambahkan baris produknya).

Jika ke depannya dibutuhkan panel admin berbasis UI (bukan langsung
lewat Supabase), beri tahu agar dapat dibangun sebagai tambahan
terpisah di rute `/admin`.

## Struktur proyek

```
src/
  app/
    api/
      callback/qris/[secret]/route.ts   # Webhook callback QRIS
      deposit/route.ts                  # Buat permintaan deposit
      deposit/[id]/status/route.ts      # Polling status deposit
      orders/route.ts                   # Buat pesanan nokos
      orders/[id]/status/route.ts       # Polling status OTP
      orders/[id]/cancel/route.ts       # Batalkan pesanan
    beli/, deposit/, dashboard/, riwayat/, login/, daftar/
  components/
    home/, beli/, deposit/, riwayat/, auth/, layout/, ui/
  hooks/
    useDepositPolling.ts, useOrderPolling.ts, useCountdown.ts
  lib/
    supabase/        # client, server, admin, middleware helper
    otp-provider/     # titik integrasi tunggal Rumah OTP
    utils.ts
  types/database.ts
supabase/
  schema.sql          # seluruh skema + RLS + RPC + seed data
```
