-- Activity telemetry integrity and deterministic verification metrics.
ALTER TABLE "activity_sessions"
  ADD COLUMN "clientSessionId" TEXT,
  ADD COLUMN "deviceAttestationVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "telemetryDigest" TEXT;

ALTER TABLE "telemetry_samples"
  ADD COLUMN "sequenceNumber" INTEGER;

ALTER TABLE "verification_results"
  ADD COLUMN "sampleCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "acceptedSampleCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discardedSampleCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "largestSampleGapSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "deviceAttestationVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "activity_sessions_telemetryDigest_key"
  ON "activity_sessions"("telemetryDigest");
CREATE UNIQUE INDEX "activity_sessions_userId_clientSessionId_key"
  ON "activity_sessions"("userId", "clientSessionId");
CREATE INDEX "activity_sessions_userId_startTime_idx"
  ON "activity_sessions"("userId", "startTime");
CREATE INDEX "activity_sessions_verificationStatus_createdAt_idx"
  ON "activity_sessions"("verificationStatus", "createdAt");
CREATE UNIQUE INDEX "telemetry_samples_activitySessionId_sequenceNumber_key"
  ON "telemetry_samples"("activitySessionId", "sequenceNumber");
DROP INDEX IF EXISTS "telemetry_samples_activitySessionId_timestamp_idx";
CREATE UNIQUE INDEX "telemetry_samples_activitySessionId_timestamp_key"
  ON "telemetry_samples"("activitySessionId", "timestamp");

ALTER TABLE "telemetry_samples"
  ADD CONSTRAINT "telemetry_samples_coordinate_range"
  CHECK (
    "latitude" BETWEEN -90 AND 90
    AND "longitude" BETWEEN -180 AND 180
    AND ("accuracy" IS NULL OR "accuracy" >= 0)
    AND ("speed" IS NULL OR "speed" >= 0)
  );
