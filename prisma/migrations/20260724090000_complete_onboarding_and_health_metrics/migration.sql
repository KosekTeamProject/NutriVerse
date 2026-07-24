ALTER TABLE "health_profiles"
  ADD COLUMN "targetWeightKg" DOUBLE PRECISION,
  ADD COLUMN "preferredActivities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "dietaryPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allergies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "favoriteFoods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "favoriteWorkoutTime" TEXT,
  ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "companion_preferences"
  ADD COLUMN "companionAvatarId" TEXT NOT NULL DEFAULT 'sparkles';

CREATE TABLE "health_metrics" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION,
  "heightCm" DOUBLE PRECISION,
  "bmi" DOUBLE PRECISION,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "health_metrics_userId_recordedAt_idx"
  ON "health_metrics"("userId", "recordedAt");

ALTER TABLE "health_metrics"
  ADD CONSTRAINT "health_metrics_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
