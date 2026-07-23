-- Align database tier names with the finalized frontend tier ladder.
ALTER TYPE "Tier" RENAME VALUE 'RUNNER' TO 'BLOOM';
ALTER TYPE "Tier" RENAME VALUE 'CHALLENGER' TO 'VITAL';
ALTER TYPE "Tier" RENAME VALUE 'PRO' TO 'RADIANT';
ALTER TYPE "Tier" RENAME VALUE 'ELITE' TO 'PEAK';
ALTER TYPE "Tier" RENAME VALUE 'MASTER' TO 'ELITE';
ALTER TYPE "Tier" RENAME VALUE 'CHAMPION' TO 'APEX';

ALTER TABLE "user_settings"
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta';

ALTER TABLE "xp_grants"
  ADD COLUMN "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "hp_ledger_entries"
  ADD COLUMN "capApplied" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "diminishingApplied" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "xp_grants_userId_createdAt_idx" ON "xp_grants"("userId", "createdAt");
CREATE INDEX "xp_grants_userId_effectiveAt_idx" ON "xp_grants"("userId", "effectiveAt");
CREATE INDEX "xp_grants_activitySessionId_idx" ON "xp_grants"("activitySessionId");
CREATE INDEX "xp_grants_challengeId_idx" ON "xp_grants"("challengeId");
CREATE INDEX "hp_ledger_entries_userId_createdAt_idx" ON "hp_ledger_entries"("userId", "createdAt");
CREATE INDEX "hp_ledger_entries_userId_effectiveAt_idx" ON "hp_ledger_entries"("userId", "effectiveAt");
CREATE INDEX "hp_ledger_entries_activitySessionId_idx" ON "hp_ledger_entries"("activitySessionId");
CREATE INDEX "hp_ledger_entries_redemptionId_idx" ON "hp_ledger_entries"("redemptionId");

ALTER TABLE "xp_grants"
  ADD CONSTRAINT "xp_grants_challengeId_fkey"
  FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
