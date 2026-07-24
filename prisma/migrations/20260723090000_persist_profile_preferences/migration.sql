-- Persist editable account data from Pengaturan.
ALTER TABLE "users"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "bio" TEXT;

ALTER TABLE "health_profiles"
  ADD COLUMN "dailyProteinTargetGrams" INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN "dailyWaterTargetMl" INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN "dailySleepTargetHours" DOUBLE PRECISION NOT NULL DEFAULT 8;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
