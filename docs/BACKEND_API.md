# NutriVerse Backend API

Semua endpoint personal menggunakan cookie Supabase dan memvalidasi user pada server. Request mutasi harus berasal dari origin aplikasi. Respons error menyertakan `code` dan `requestId`.

## Authentication

- `GET /api/auth/google`
- `GET /api/auth/callback`
- `GET /api/auth/session`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## User

- `GET|PUT /api/onboarding`
- `GET|PATCH /api/profile`
- `GET|PATCH /api/settings`
- `GET /api/me`
- `GET /api/economy`
- `GET /api/badges`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`

## Activity and GPS

- `POST /api/activities/start`
- `POST /api/activities/:activityId/telemetry` — maksimal 500 titik per batch
- `POST /api/activities/:activityId/finish`
- `GET /api/activities`
- `GET /api/activities/:activityId`

Penyelesaian aktivitas menjalankan verifikasi telemetry, reward XP/HP idempoten, kontribusi challenge, streak, tier, dan evaluasi badge. Aktivitas simulasi disimpan sebagai riwayat namun tidak memperoleh reward.

## Health and nutrition

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

## Challenge, leaderboard, and rewards

- `GET /api/challenges`
- `GET /api/challenges/:challengeId`
- `POST /api/challenges/:challengeId/join`
- `POST /api/challenges/:challengeId/claim`
- `GET /api/leaderboard`
- `GET /api/rewards`
- `POST /api/rewards/:rewardId/claim` — wajib memakai `idempotencyKey`
- `GET /api/rewards/history`

## Community and guild

- `GET|POST /api/community/posts`
- `PATCH|DELETE /api/community/posts/:postId`
- `POST /api/community/posts/:postId/comments`
- `PUT|DELETE /api/community/posts/:postId/reaction`
- `POST /api/community/reports`
- `GET|POST /api/guilds`
- `POST|DELETE /api/guilds/:guildId/membership`

## Storage

- `POST|DELETE /api/storage/upload`

Bucket yang disiapkan: `avatars`, `post-images`, dan `activity-shares`. Folder pertama harus sama dengan Supabase Auth user ID. Ukuran dan MIME type dibatasi oleh API dan Storage policy.

## Admin

Endpoint berikut memerlukan role `ADMIN` atau `MODERATOR`:

- `GET /api/admin/overview`
- `PATCH /api/admin/activities/:activityId/review`
- `PATCH /api/admin/reports/:reportId`

Semua keputusan review menghasilkan audit log.

## Verification commands

```bash
pnpm exec prisma migrate status
pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
pnpm exec tsc --noEmit
pnpm test:backend
pnpm test:integration
pnpm build
```
