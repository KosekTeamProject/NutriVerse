INSERT INTO "sleep_logs" ("id", "userId", "durationHours", "loggedAt")
SELECT
    'legacy-' || "id",
    "userId",
    "sleepHours",
    "pulseDate" + INTERVAL '12 hours'
FROM "health_pulses"
WHERE "sleepHours" IS NOT NULL
  AND "sleepHours" > 0
  AND NOT EXISTS (
      SELECT 1
      FROM "sleep_logs"
      WHERE "sleep_logs"."id" = 'legacy-' || "health_pulses"."id"
  );
