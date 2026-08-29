INSERT INTO "badges" (
  "id", "code", "name", "description", "iconUrl", "criteriaKey", "targetValue", "createdAt"
)
VALUES
  (md5('badge-first-step'), 'FIRST_STEP', 'Langkah Pertama', 'Selesaikan aktivitas olahraga pertama Anda.', '/badges/first-step.png', 'VERIFIED_ACTIVITY_COUNT', 1, CURRENT_TIMESTAMP),
  (md5('badge-streak-master'), 'STREAK_MASTER', 'Streak Master', 'Pertahankan streak aktivitas selama 7 hari berturut-turut.', '/badges/streak-master.png', 'STREAK_DAYS', 7, CURRENT_TIMESTAMP),
  (md5('badge-active-10'), 'ACTIVE_10', 'Ritme Terbentuk', 'Selesaikan 10 aktivitas yang lolos verifikasi.', '/badges/active-10.png', 'VERIFIED_ACTIVITY_COUNT', 10, CURRENT_TIMESTAMP),
  (md5('badge-distance-50k'), 'DISTANCE_50K', 'Penjelajah 50K', 'Tempuh total 50 kilometer dari aktivitas terverifikasi.', '/badges/distance-50k.png', 'VERIFIED_DISTANCE_METERS', 50000, CURRENT_TIMESTAMP),
  (md5('badge-challenge-5'), 'CHALLENGE_5', 'Pemburu Tantangan', 'Selesaikan 5 tantangan terverifikasi.', '/badges/challenge-5.png', 'COMPLETED_CHALLENGE_COUNT', 5, CURRENT_TIMESTAMP),
  (md5('badge-event-explorer'), 'EVENT_EXPLORER', 'Event Explorer', 'Hadir dan terverifikasi di 3 event NutriVerse.', '/badges/event-explorer.png', 'ATTENDED_EVENT_COUNT', 3, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "iconUrl" = EXCLUDED."iconUrl",
  "criteriaKey" = EXCLUDED."criteriaKey",
  "targetValue" = EXCLUDED."targetValue";
