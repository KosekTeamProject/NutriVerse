# NutriVerse Backend API

Semua endpoint personal memakai cookie Supabase dan memvalidasi pengguna pada server. Request mutasi wajib berasal dari origin aplikasi. Respons error memakai `code`, `error`, dan `requestId`.

## Authentication dan pengguna

- `GET /api/auth/google`
- `GET /api/auth/callback`
- `GET /api/auth/session`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET|PUT /api/onboarding`
- `GET|PATCH /api/profile`
- `GET|PATCH /api/settings`
- `GET|PATCH /api/me`
- `GET /api/economy`
- `GET /api/badges`

## Aktivitas GPS dan anti-cheat

- `GET /api/activities`
- `POST /api/activities/start`
- `GET|DELETE /api/activities/:activityId`
- `POST /api/activities/:activityId/telemetry`
- `POST /api/activities/:activityId/finish`
- `GET|POST /api/activities/:activityId/appeals`

Telemetry dibatasi 500 titik per batch dan 50.000 titik per aktivitas. Penyimpanan batch, finish, verifikasi, reward, challenge, dan badge dibuat idempoten serta aman terhadap request paralel. Verifikasi memeriksa urutan, timestamp, akurasi, gap, teleportasi, kecepatan per jenis aktivitas, pause/resume, simulasi, replay telemetry, dan opsional device attestation.

Aktifkan `REQUIRE_ACTIVITY_DEVICE_ATTESTATION=true` hanya jika aplikasi native/wearable sudah mengirim attestation yang tervalidasi server. Browser biasa tidak menyediakan attestation hardware yang dapat dipercaya.

## Health, nutrisi, jurnal, dan Journey

- `GET|POST /api/health/metrics`
- `PATCH|DELETE /api/health/metrics/:metricId`
- `GET|POST /api/health/pulse`
- `GET|POST /api/nutrition/entries`
- `DELETE /api/nutrition/entries/:entryId`
- `GET /api/nutrition/summary`
- `POST /api/nutrition/water`
- `GET|POST /api/nutrition/custom-foods`
- `GET /api/nutrition/search`
- `GET|POST /api/journal`
- `PATCH|DELETE /api/journal/:entryId`
- `POST /api/journal/:entryId/attachments`
- `DELETE /api/journal/:entryId/attachments/:attachmentId`
- `GET|POST /api/journey`
- `PATCH|DELETE /api/journey/:journeyId`

Health Pulse dan ringkasan nutrisi memakai batas hari menurut `settings.timezone`, bukan UTC mentah. Pencarian USDA memiliki rate limit dan cache database.

## Challenge, leaderboard, dan reward

- `GET /api/challenges`
- `GET /api/challenges/:challengeId`
- `POST /api/challenges/:challengeId/join`
- `POST /api/challenges/:challengeId/claim`
- `GET /api/leaderboard?scope=LEAGUE|FRIENDS|LOCAL`
- `GET /api/rewards`
- `POST /api/rewards/:rewardId/claim`
- `GET /api/rewards/history`
- `POST /api/rewards/redemptions/:redemptionId/cancel`

Klaim reward wajib memakai `idempotencyKey`. Pembatalan/kedaluwarsa mengembalikan stok dan HP satu kali saja. Refund lebih dulu melunasi `hpDebt` yang muncul bila reward anti-cheat dibatalkan setelah HP telanjur dipakai.

## Community, Moments, koneksi, dan event

- `GET|POST /api/community/posts`
- `PATCH|DELETE /api/community/posts/:postId`
- `POST /api/community/posts/:postId/comments`
- `PUT|DELETE /api/community/posts/:postId/reaction`
- `POST /api/community/reports`
- `GET|POST /api/guilds`
- `POST|DELETE /api/guilds/:guildId/membership`
- `GET|POST /api/moments`
- `PATCH|DELETE /api/moments/:momentId`
- `PUT|DELETE /api/moments/:momentId/reaction`
- `GET|POST /api/connections`
- `PATCH|DELETE /api/connections/:connectionId`
- `GET /api/events`
- `POST|DELETE /api/events/:eventId/registration`

Konten `CIRCLE` hanya dapat dibaca koneksi berstatus `ACCEPTED`. Post, komentar, reaksi, report, dan RLS memakai aturan akses yang sama.

## Notifikasi, storage, dan privasi

- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `GET|POST|DELETE /api/notifications/devices`
- `POST|DELETE /api/storage/upload`
- `GET /api/storage/signed-url`
- `GET /api/privacy/export`
- `DELETE /api/privacy/location-history`
- `DELETE /api/privacy/account`

Bucket: `avatars`, `post-images`, `activity-shares`, dan `journal-attachments`. Gambar divalidasi berdasarkan isi biner, dibatasi dimensinya, lalu di-encode ulang tanpa EXIF. File privat diakses melalui signed URL 10 menit.

Penghapusan akun memerlukan body `{ "confirmation": "DELETE" }` dan `SUPABASE_SERVICE_ROLE_KEY` pada server.

## Admin

Role `ADMIN` atau `MODERATOR`:

- `GET /api/admin/overview`
- `GET /api/admin/activities`
- `POST /api/admin/activities/:activityId/retry`
- `PATCH /api/admin/activities/:activityId/review`
- `GET /api/admin/appeals`
- `PATCH /api/admin/appeals/:appealId/review`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:reportId`
- `GET /api/admin/audit-logs`
- `GET|POST /api/admin/challenges`
- `PATCH|DELETE /api/admin/challenges/:challengeId`
- `GET|POST /api/admin/events`
- `PATCH|DELETE /api/admin/events/:eventId`
- `GET /api/admin/events/:eventId/registrations`
- `PATCH /api/admin/events/:eventId/registrations/:registrationId`
- `GET|POST /api/admin/rewards`
- `PATCH|DELETE /api/admin/rewards/:rewardId`
- `GET /api/admin/redemptions`
- `PATCH /api/admin/redemptions/:redemptionId`
- `GET|POST /api/admin/leaderboard-seasons`
- `PATCH /api/admin/leaderboard-seasons/:seasonId`

Khusus role `ADMIN`:

- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`

Review aktivitas yang ditolak membalik XP, HP, progress/claim challenge, tier, streak, dan badge secara idempoten. Semua keputusan administratif dicatat di audit log.

## Maintenance

- `GET|POST /api/internal/maintenance`

Endpoint memakai `Authorization: Bearer <MAINTENANCE_SECRET>` atau `x-maintenance-secret`. Jalankan terjadwal untuk membersihkan cache/rate bucket, token perangkat usang, GPS melewati retensi, sesi aktivitas terlantar, redemption kedaluwarsa, dan membangun snapshot leaderboard.

Perintah:

```bash
pnpm maintenance:preview
pnpm maintenance:backend
pnpm validate:migration
pnpm exec prisma migrate status
pnpm exec tsc --noEmit
pnpm test:backend
pnpm test:integration
pnpm build
```
