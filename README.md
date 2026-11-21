# ZELVO – Marketplace template striping Drag Bike 201m Sunmori

Dikembangkan oleh **Fizzxdevv × Kographh**.
Stack: Next.js 14 (App Router), Supabase (Auth, Postgres, Storage), Midtrans Snap, Tailwind, sharp.

## 1. Setup cepat

```bash
npm install
cp .env.example .env.local   # isi semua nilainya
npm run dev
```

### Supabase
1. Buat project, buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql`
   (tabel, RLS, fungsi, trigger, dan 3 bucket: `templates` privat, `thumbnails` dan `review-images` publik).
2. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Settings, API).
   Service role key hanya dipakai di server, jangan pernah diberi awalan `NEXT_PUBLIC_`.
3. Authentication, URL Configuration: isi **Site URL** dengan domain ZELVO dan tambahkan `https://domainmu/auth/callback` ke Redirect URLs.
   Untuk testing cepat, matikan "Confirm email".
4. Register satu akun lewat web, lalu jadikan admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'emailkamu@gmail.com';
   ```
5. (Opsional) aktifkan `pg_cron` dan jalankan baris `cron.schedule` di bagian bawah `schema.sql` supaya auto-accept 5 menit berjalan tiap menit.
   Tanpa itu tetap jalan: pengajuan diproses otomatis setiap kali halaman status/admin dibuka, ditambah cron harian Vercel.

### Midtrans (Snap)
- Isi `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` (`false` = sandbox).
- Dashboard Midtrans, Settings, Payment, **Notification URL**: `https://domainmu/api/midtrans/notification`
- Webhook memvalidasi `signature_key`, lalu mengonfirmasi ulang status ke Midtrans sebelum saldo penjual dikreditkan (idempotent).

### Variabel penting
| Env | Fungsi |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Domain asli ZELVO**. Dipakai untuk QR legal, link share, callback Midtrans. |
| `APP_SECRET` | Kunci HMAC kode verifikasi bukti saldo. Isi string acak panjang. |
| `CRON_SECRET` | Token untuk `/api/cron/maintenance`. |
| `PLATFORM_FEE_PERCENT` | Potongan platform per penjualan berbayar (default **10**, sesuaikan kebijakanmu). |

## 2. Alur fitur

| Fitur | Cara kerja |
|---|---|
| Role | `user` (login/register saja), `seller` (penyumbang/penjual), `admin`. |
| Jadi penjual | `/seller/apply`, status `pending`, **auto-accept 5 menit**. Admin (`/admin/applications`) bisa setujui sekarang, tolak, **tahan auto-accept**, atau **cabut** keputusan otomatis (produk penjual disembunyikan). |
| Pop-up referensi | Penjual baru melihat referensi desain resmi (bisa diunduh) sekali saat pertama masuk dashboard. Bisa dibuka lagi lewat "Lihat referensi desain". File: `public/reference/official-reference.png`. |
| Upload | PNG **1024x1024**, wajib **transparan**, divalidasi di browser dan **di server (sharp)**. File asli ke bucket **privat**; publik hanya melihat JPEG ber-watermark yang dibuat otomatis. Wajib pilih kategori gaya dan motor. |
| Gratis / berbayar | Harga 0 = gratis, atau Rp 1.000 sampai 500.000. Download lewat signed URL 60 detik, hanya setelah login (gratis) atau lunas (berbayar). |
| Install dan rating | Install dihitung **unik per pengguna** per produk. Hanya yang sudah install/beli boleh memberi rating (gambar opsional). |
| Verifikasi toko | 20 rating atau lebih dengan rata-rata minimal 4.0 mendapat centang. Rata-rata turun masuk **trial 10 hari**; jika masih rendah centang dicabut dengan saran meningkatkan kualitas. Dihitung trigger database + cron harian. |
| Halaman produk | Rating pengguna, kartu toko dan rating toko, "Lainnya dari toko ini", lalu **terpisah** "Rekomendasi dari toko lain". |
| Dashboard penjual | Ringkasan, produk (install/rating), **transaksi** (berbayar dan install gratis), tarik saldo. |
| Tarik saldo | Minimal **Rp 25.000**. Pengajuan atomik di DB, gambar bukti saldo digenerate server (kode verifikasi HMAC), pesan template otomatis ke WhatsApp 0877-8958-3465; tombol cadangan 0889-8111-4939 aktif setelah 10 menit. |
| QR legal | `/admin/withdrawals` (khusus admin) menampilkan QR ke `https://domain-asli/legal/<token>`. Halaman itu **404 untuk publik** sampai admin menekan **Publikasikan**; setelah itu link bisa dibagikan, berisi pernyataan legal dan watermark. |
| Share | Gambar feed 4:5 / story 9:16 berisi QR dan link produk; tombol Instagram (Web Share API), WhatsApp, Threads, X. |
| Navbar | Di bawah layar pada mobile; kapsul melayang di bawah pada desktop. Mode gelap (hitam-biru) dan terang (putih-biru navy). |

## 3. Catatan keamanan
- Semua penulisan data lewat server (service role); RLS aktif di semua tabel, fungsi bisnis di-`revoke` dari `anon/authenticated`.
- Saldo hanya bertambah lewat `settle_order` (webhook Midtrans tervalidasi) dan hanya berkurang lewat `create_withdrawal`.
- Bukti saldo bukan sekadar gambar: kode di gambar harus cocok dengan database. Admin mengecek lewat kolom "Cek kode verifikasi" di `/admin/withdrawals`.
- Thumbnail publik adalah JPEG yang sudah di-flatten dan diberi watermark, tanpa alpha channel.

## 4. Deploy
Vercel direkomendasikan (`vercel.json` berisi cron harian). Pastikan semua env terisi, lalu set Notification URL Midtrans ke domain produksi.
Font untuk gambar server ada di `assets/fonts/` dan ikut ter-bundle lewat `outputFileTracingIncludes`.

## 5. Menyesuaikan
- Kategori gaya dan motor: tabel `style_categories` / `motor_categories`.
- Warna: variabel CSS di `app/globals.css` (`:root` terang, `.dark` gelap).
- Link game dan nomor WhatsApp: `lib/constants.ts`.
