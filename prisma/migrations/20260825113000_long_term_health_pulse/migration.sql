-- Preserve legacy rows while making the new long-term score explicitly nullable.
-- Legacy daily scores remain stored, but are not marked as published long-term Pulse.
ALTER TABLE "health_pulses"
  ALTER COLUMN "overallScore" DROP NOT NULL,
  ALTER COLUMN "overallScore" DROP DEFAULT,
  ADD COLUMN "sleepScore" DOUBLE PRECISION,
  ADD COLUMN "hydrationScore" DOUBLE PRECISION,
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "phase" TEXT NOT NULL DEFAULT 'LEARNING',
  ADD COLUMN "phaseCap" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "analysisDay" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "routineScore7" DOUBLE PRECISION,
  ADD COLUMN "routineScore28" DOUBLE PRECISION,
  ADD COLUMN "routineScore90" DOUBLE PRECISION,
  ADD COLUMN "dataCoverage7" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "dataCoverage28" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "dataDays7" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "dimensionCount7" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "weightTrendBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "noDataStreak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "dimensionScores" JSONB,
  ADD COLUMN "reasons" JSONB,
  ADD COLUMN "focusDimension" TEXT,
  ADD COLUMN "strongestDimension" TEXT;

CREATE INDEX "health_pulses_userId_isPublished_pulseDate_idx"
  ON "health_pulses"("userId", "isPublished", "pulseDate");
