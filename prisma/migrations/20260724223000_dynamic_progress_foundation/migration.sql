ALTER TABLE "health_profiles"
  ADD COLUMN "dailyCalorieTarget" INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN "dailyCarbTargetGrams" INTEGER NOT NULL DEFAULT 220,
  ADD COLUMN "dailyFiberTargetGrams" INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN "dailyActiveTargetMinutes" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "health_profiles"
  ADD CONSTRAINT "health_profiles_daily_targets_check"
  CHECK (
    "dailyCalorieTarget" BETWEEN 500 AND 10000
    AND "dailyCarbTargetGrams" BETWEEN 20 AND 1500
    AND "dailyFiberTargetGrams" BETWEEN 5 AND 200
    AND "dailyActiveTargetMinutes" BETWEEN 5 AND 1440
  );

ALTER TABLE "nutrition_entries"
  ADD COLUMN "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "sugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "sodiumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "mealType" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "isUserConfirmed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "nutrition_entries"
SET "loggedAt" = "createdAt";

ALTER TABLE "nutrition_entries"
  ADD CONSTRAINT "nutrition_entries_extended_values_check"
  CHECK (
    "fiber" >= 0
    AND "sugar" >= 0
    AND "sodiumMg" >= 0
    AND "source" IN ('MANUAL', 'SCAN', 'DATABASE', 'IMPORT')
  );

CREATE INDEX "nutrition_entries_userId_loggedAt_idx"
  ON "nutrition_entries"("userId", "loggedAt");
