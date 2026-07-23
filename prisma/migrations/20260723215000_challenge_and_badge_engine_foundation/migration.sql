CREATE TYPE "ChallengeMetric" AS ENUM (
  'DISTANCE_METERS',
  'DURATION_SECONDS',
  'VERIFIED_ACTIVITY_COUNT'
);
CREATE TYPE "ChallengeCategory" AS ENUM (
  'CARDIO',
  'MOBILITY',
  'STRENGTH',
  'NUTRITION',
  'RECOVERY',
  'HABIT'
);

ALTER TABLE "challenges"
  ADD COLUMN "category" "ChallengeCategory" NOT NULL DEFAULT 'CARDIO',
  ADD COLUMN "metric" "ChallengeMetric" NOT NULL DEFAULT 'DISTANCE_METERS',
  ADD COLUMN "activityType" "ActivityType";

ALTER TABLE "challenge_progresses"
  ADD COLUMN "claimedHpLedgerEntryId" TEXT,
  ADD COLUMN "lastContributedAt" TIMESTAMP(3);

ALTER TABLE "hp_ledger_entries"
  ADD COLUMN "challengeId" TEXT;

CREATE TABLE "challenge_contributions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "challengeProgressId" TEXT NOT NULL,
  "activitySessionId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "challenge_contributions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "challenge_contributions_amount_positive" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "challenge_progresses_claimedXpGrantId_key"
  ON "challenge_progresses"("claimedXpGrantId");
CREATE UNIQUE INDEX "challenge_progresses_claimedHpLedgerEntryId_key"
  ON "challenge_progresses"("claimedHpLedgerEntryId");
CREATE INDEX "hp_ledger_entries_challengeId_idx"
  ON "hp_ledger_entries"("challengeId");
CREATE UNIQUE INDEX "challenge_contributions_challengeId_userId_activitySessionId_key"
  ON "challenge_contributions"("challengeId", "userId", "activitySessionId");
CREATE INDEX "challenge_contributions_challengeProgressId_createdAt_idx"
  ON "challenge_contributions"("challengeProgressId", "createdAt");
CREATE INDEX "challenge_contributions_activitySessionId_idx"
  ON "challenge_contributions"("activitySessionId");

ALTER TABLE "challenge_progresses"
  ADD CONSTRAINT "challenge_progresses_claimedXpGrantId_fkey"
  FOREIGN KEY ("claimedXpGrantId") REFERENCES "xp_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "challenge_progresses"
  ADD CONSTRAINT "challenge_progresses_claimedHpLedgerEntryId_fkey"
  FOREIGN KEY ("claimedHpLedgerEntryId") REFERENCES "hp_ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hp_ledger_entries"
  ADD CONSTRAINT "hp_ledger_entries_challengeId_fkey"
  FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "challenge_contributions"
  ADD CONSTRAINT "challenge_contributions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "challenge_contributions"
  ADD CONSTRAINT "challenge_contributions_challengeId_fkey"
  FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "challenge_contributions"
  ADD CONSTRAINT "challenge_contributions_challengeProgressId_fkey"
  FOREIGN KEY ("challengeProgressId") REFERENCES "challenge_progresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "challenge_contributions"
  ADD CONSTRAINT "challenge_contributions_activitySessionId_fkey"
  FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
