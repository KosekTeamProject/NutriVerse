# Status Backend NutriVerse

Audit dan implementasi terakhir: 24 Juli 2026.

## Selesai

- Supabase Auth email/password, Google OAuth, cookie session, refresh Proxy, proteksi halaman, role, dan suspend akun.
- Onboarding, profil, pengaturan, target kesehatan, timezone, region leaderboard, serta preferensi retensi GPS.
- Aktivitas GPS real-time: start, batch telemetry, pause/resume segment, finish, riwayat, detail rute, jarak, pace, kecepatan, dan MapLibre/OpenFreeMap.
- Anti-cheat server: validasi koordinat, timestamp/urutan, akurasi, gap, teleportasi, batas kecepatan per aktivitas, simulasi, replay digest, dan opsi device attestation.
- Lifecycle finalisasi dengan processing state, lease anti-race, retry admin, idempotensi, serta batas 50.000 telemetry.
- XP/HP ledger, cap harian, diminishing return, tier, streak, `hpDebt`, rollback aktivitas, rollback challenge, reinstatement, dan rekonsiliasi badge.
- Banding pengguna dan review admin dengan audit log serta notifikasi.
- Challenge, badge, season, leaderboard LEAGUE/FRIENDS/LOCAL, dan snapshot maintenance.
- Reward store lengkap: stok atomik, redeem idempoten, expiry, cancel, refund, fulfillment, dan administrasi reward/redemption.
- Nutrisi, custom food, water, ringkasan timezone-aware, cache pencarian USDA, health metrics, BMI, dan Health Pulse.
- Journal privat, lampiran privat, signed URL, serta Journey.
- Post, comment, reaction, guild, report/moderasi, Moments, event/registrasi, dan koneksi/block.
- Notifikasi database dan registrasi token perangkat.
- Admin API untuk user, activity, appeal, report, challenge, event, reward, redemption, season, overview, dan audit.
- Rate limit persisten dengan fallback memory, same-origin checks, request ID, validasi payload, dan akun tersuspensi.
- Upload gambar dengan validasi isi, pembatasan pixel, re-encode, dan penghapusan EXIF.
- Ekspor data, hapus koordinat GPS, hapus akun, retensi GPS per pengguna, dan maintenance.
- RLS tabel baru serta koreksi akses PRIVATE/CIRCLE pada post, komentar, Moment, event, dan ranking.
- Migrasi `20260724170000_backend_completion_foundation` dan `20260724180000_connection_pair_integrity` sudah diterapkan ke Supabase.

## Hasil verifikasi

- Prisma schema valid dan status database sinkron.
- Dry-run SQL migrasi dalam transaksi rollback berhasil.
- TypeScript lulus tanpa error.
- 24/24 unit test backend lulus.
- Lint lulus tanpa error; tersisa warning frontend lama yang tidak diubah.
- Production build Next.js lulus.
- Smoke test Supabase lulus untuk verifikasi GPS, reward idempoten, challenge, badge, dan redemption; data uji dibersihkan.
- Preview maintenance: tidak ada GPS/sesi/redemption/cache kedaluwarsa pada saat pemeriksaan.

## Konfigurasi production yang masih diperlukan

- `MAINTENANCE_SECRET` dan scheduler/cron untuk `/api/internal/maintenance`.
- `SUPABASE_SERVICE_ROLE_KEY` untuk penghapusan akun menyeluruh.
- `USDA_FDC_API_KEY` bila pencarian online tanpa fallback lokal diperlukan.
- SMTP production, callback OAuth domain production, MFA admin, monitoring, alerting, dan backup.
- Provider push FCM/APNs untuk benar-benar mengirim token perangkat; notifikasi in-app sudah tersimpan.
- Integrasi mitra untuk fulfillment voucher/merchandise; lifecycle internalnya sudah tersedia.
- Pengujian GPS fisik di beberapa perangkat dan kondisi sinyal.
- Aplikasi native/wearable dan validator attestation jika `REQUIRE_ACTIVITY_DEVICE_ATTESTATION=true` akan digunakan.

## Sengaja ditunda

AI Companion, vision scanner, weekly letter generator, dan seluruh integrasi model AI tidak diimplementasikan pada tahap ini sesuai permintaan. Struktur/model lama tidak dihapus dan dapat dilanjutkan pada prompt khusus AI berikutnya.

## Catatan frontend

Tahap ini tidak mengubah struktur atau tema frontend. Beberapa panel visual lama masih memakai presentational/demo data dan perlu wiring frontend terpisah jika seluruh UI hendak memakai API baru.
