ALTER TABLE "activity_sessions"
  ADD COLUMN "activeDurationSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pausedDurationSeconds" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "telemetry_samples"
  ADD COLUMN "segmentNumber" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "telemetry_activity_segment_sequence_idx"
  ON "telemetry_samples"("activitySessionId", "segmentNumber", "sequenceNumber");
