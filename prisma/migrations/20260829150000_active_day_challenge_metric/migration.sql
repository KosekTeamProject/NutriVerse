ALTER TYPE "ChallengeMetric" ADD VALUE IF NOT EXISTS 'ACTIVE_DAY_COUNT';

ALTER TABLE "challenge_contributions"
  ADD COLUMN "dayKey" TEXT;

CREATE INDEX "challenge_contributions_challengeId_userId_dayKey_idx"
  ON "challenge_contributions"("challengeId", "userId", "dayKey");
