INSERT INTO "challenges" (
  "id", "title", "description", "type", "category", "trustLevel", "metric",
  "targetValue", "targetUnit", "bonusXp", "bonusHp", "startDate", "endDate",
  "isActive", "createdAt", "updatedAt"
)
VALUES
  ('challenge-weekly-active-3-days', 'Ritme 3 Hari', 'Aktif pada 3 hari berbeda dalam satu pekan melalui aktivitas yang lolos verifikasi.', 'WEEKLY', 'CARDIO', 'GPS_VERIFIED_ONLY', 'ACTIVE_DAY_COUNT', 3, 'DAYS', 50, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('challenge-weekly-active-5-days', 'Konsisten 5 Hari', 'Aktif pada 5 hari berbeda dalam satu pekan melalui aktivitas yang lolos verifikasi.', 'WEEKLY', 'CARDIO', 'GPS_VERIFIED_ONLY', 'ACTIVE_DAY_COUNT', 5, 'DAYS', 75, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "startDate" = EXCLUDED."startDate",
  "endDate" = EXCLUDED."endDate",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
