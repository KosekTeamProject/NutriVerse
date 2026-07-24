-- Persist user-controlled toggles from Pengaturan.
ALTER TABLE "user_settings"
  ADD COLUMN "leaderboardVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "challengeProgressVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notificationsActivity" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notificationsLeaderboard" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notificationsSocial" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "companionInsightsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "companionSafetyNotesEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "useDemoData" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "showSimulationLabels" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "gpsSimulationEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "foodSimulationEnabled" BOOLEAN NOT NULL DEFAULT true;
