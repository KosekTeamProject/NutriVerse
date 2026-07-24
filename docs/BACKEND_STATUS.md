# Status Backend NutriVerse

Tanggal audit: 24 Juli 2026

## Selesai

- Supabase Google OAuth dan email/password authentication.
- Cookie session Supabase sebagai sumber autentikasi server.
- Refresh session melalui Next.js 16 Proxy.
- Proteksi halaman personal dan role admin.
- Registrasi, login, logout, lupa kata sandi, dan reset kata sandi.
- Sinkronisasi identitas Supabase ke profil domain Prisma.
- Onboarding persisten beserta baseline kesehatan, preferensi, dan AI Companion.
- Profil, pengaturan, avatar Storage, dan ekonomi user.
- Activity start, batch telemetry, finish, verifikasi GPS, riwayat, dan detail rute.
- Penolakan reward untuk data simulasi atau telemetry tidak valid.
- XP/HP ledger, daily cap, diminishing return, tier, dan streak.
- Idempotency dan retry transaksi serializable.
- Challenge join, progress otomatis, completion, dan claim.
- Badge otomatis.
- Nutrition log, pencarian, custom food, ringkasan harian, dan water log.
- Health metric, BMI, riwayat, dan Health Pulse.
- Reward list, pemeriksaan saldo/stok, redeem, dan history.
- Leaderboard database.
- Community post, comment, reaction, report, dan guild membership.
- Journal privat dan notifikasi.
- Admin overview, review activity, moderation report, dan audit log.
- Supabase RLS untuk seluruh tabel sensitif dan master.
- Bucket `avatars`, `post-images`, dan `activity-shares` beserta policy.
- Security headers, same-origin mutation checks, payload validation, request ID, dan rate limit auth/spam.
- Seed idempoten untuk badge, challenge, season, reward, dan food master.
- CI untuk install, Prisma generate, TypeScript, lint, unit test, dan build.
- Dokumentasi endpoint di `docs/BACKEND_API.md`.

## Integrasi UI yang sudah aktif

- Google OAuth.
- Login email.
- Registrasi dan penyimpanan onboarding.
- Refresh/logout session.
- Saldo XP/HP pada AppShell.
- GPS tracker ke Activity API.
- Riwayat dan detail aktivitas database.
- Reward digital dan saldo HP database.
- Upload avatar Supabase Storage.
- Nama AI Companion persisten.
- Proteksi portal admin berdasarkan role database.

## Masih memerlukan layanan atau keputusan eksternal

- Domain, hosting staging/production, serta environment production.
- Callback URL Google dan Supabase untuk domain production.
- SMTP production dan template email konfirmasi/reset.
- Pengujian OAuth production dengan beberapa akun Google.
- Pengujian GPS fisik menggunakan HP di luar ruangan.
- Pengujian RLS memakai dua akun Auth nyata dan pengujian upload/delete Storage dari browser.
- Kunci USDA FDC bila pencarian makanan online tanpa fallback diinginkan.
- Provider AI/vision untuk scanner makanan dan AI Companion nyata.
- Integrasi mitra untuk fulfillment voucher/merchandise.
- Monitoring error, log aggregation, backup, dan alert production.
- MFA admin dan prosedur pemberian role admin oleh pemilik sistem.
- Kebijakan retensi serta penyederhanaan koordinat GPS.

## Panel frontend yang masih memakai presentational/demo data

Backend endpoint sudah tersedia, tetapi komponen visual berikut belum seluruhnya diganti sumber datanya:

- Dashboard hero dan sebagian widget Health Pulse.
- Kartu Challenge Hub.
- Feed komunitas, event, dan beberapa statistik komunitas.
- Tampilan leaderboard lama.
- Sebagian form pengaturan/target harian.
- Jurnal UI lama.
- Dashboard operasional admin selain autentikasi/route API.
- AI Companion dan scanner foto makanan.

Bagian tersebut tidak menghambat API backend, tetapi perlu tahap wiring frontend agar semua angka di layar sepenuhnya berasal dari database.
