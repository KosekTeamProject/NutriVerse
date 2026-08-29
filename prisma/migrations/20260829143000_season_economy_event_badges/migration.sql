CREATE TYPE "RewardSource" AS ENUM (
  'ACTIVITY',
  'CHALLENGE',
  'EVENT_PARTICIPATION',
  'EVENT_PODIUM',
  'SEASON_CARRYOVER',
  'SEASON_REWARD',
  'REDEMPTION',
  'REFUND',
  'REVERSAL',
  'SYSTEM'
);

ALTER TABLE "xp_grants"
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "source" "RewardSource" NOT NULL DEFAULT 'ACTIVITY',
  ADD COLUMN "formulaVersion" TEXT NOT NULL DEFAULT 'activity-distance-v1',
  ADD COLUMN "countsTowardLifetime" BOOLEAN NOT NULL DEFAULT true;

UPDATE "xp_grants"
SET "source" = CASE
  WHEN "type" = 'XP_REVERSAL' THEN 'REVERSAL'::"RewardSource"
  WHEN "challengeId" IS NOT NULL THEN 'CHALLENGE'::"RewardSource"
  ELSE 'ACTIVITY'::"RewardSource"
END;

ALTER TABLE "hp_ledger_entries"
  ADD COLUMN "eventId" TEXT,
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "source" "RewardSource" NOT NULL DEFAULT 'ACTIVITY',
  ADD COLUMN "formulaVersion" TEXT NOT NULL DEFAULT 'activity-distance-v1';

UPDATE "hp_ledger_entries"
SET "source" = CASE
  WHEN "type" IN ('HP_REVERSAL', 'HP_EXPIRED') THEN 'REVERSAL'::"RewardSource"
  WHEN "type" = 'HP_REDEEM' THEN 'REDEMPTION'::"RewardSource"
  WHEN "type" = 'HP_REFUND' THEN 'REFUND'::"RewardSource"
  WHEN "challengeId" IS NOT NULL THEN 'CHALLENGE'::"RewardSource"
  ELSE 'ACTIVITY'::"RewardSource"
END;

ALTER TABLE "badges"
  ADD COLUMN "criteriaKey" TEXT NOT NULL DEFAULT 'VERIFIED_ACTIVITY_COUNT',
  ADD COLUMN "targetValue" INTEGER NOT NULL DEFAULT 1;

UPDATE "badges" SET "criteriaKey" = 'STREAK_DAYS', "targetValue" = 7 WHERE "code" = 'STREAK_MASTER';

ALTER TABLE "leaderboard_seasons"
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  ADD COLUMN "finalizedAt" TIMESTAMP(3);

ALTER TABLE "events"
  ADD COLUMN "participationHp" INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN "firstPlaceBonusHp" INTEGER NOT NULL DEFAULT 150,
  ADD COLUMN "secondPlaceBonusHp" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "thirdPlaceBonusHp" INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN "rewardsLockedAt" TIMESTAMP(3),
  ADD COLUMN "resultsFinalizedAt" TIMESTAMP(3);

ALTER TABLE "event_registrations"
  ADD COLUMN "placement" INTEGER,
  ADD COLUMN "rewardedAt" TIMESTAMP(3);

CREATE TABLE "season_participants" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lifetimeTierAtStart" "Tier" NOT NULL DEFAULT 'SPROUT',
  "carryoverXp" INTEGER NOT NULL DEFAULT 0,
  "earnedXp" INTEGER NOT NULL DEFAULT 0,
  "activeDayCount" INTEGER NOT NULL DEFAULT 0,
  "verifiedActivityCount" INTEGER NOT NULL DEFAULT 0,
  "verifiedChallengeCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "finalPosition" INTEGER,
  "seasonRewardHp" INTEGER NOT NULL DEFAULT 0,
  "finalizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "season_participants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_seasonId_fkey"
  FOREIGN KEY ("seasonId") REFERENCES "leaderboard_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hp_ledger_entries" ADD CONSTRAINT "hp_ledger_entries_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hp_ledger_entries" ADD CONSTRAINT "hp_ledger_entries_seasonId_fkey"
  FOREIGN KEY ("seasonId") REFERENCES "leaderboard_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "season_participants" ADD CONSTRAINT "season_participants_seasonId_fkey"
  FOREIGN KEY ("seasonId") REFERENCES "leaderboard_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "season_participants" ADD CONSTRAINT "season_participants_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "xp_grants_seasonId_userId_effectiveAt_idx" ON "xp_grants"("seasonId", "userId", "effectiveAt");
CREATE INDEX "hp_ledger_entries_eventId_idx" ON "hp_ledger_entries"("eventId");
CREATE INDEX "hp_ledger_entries_seasonId_userId_effectiveAt_idx" ON "hp_ledger_entries"("seasonId", "userId", "effectiveAt");
CREATE UNIQUE INDEX "season_participants_seasonId_userId_key" ON "season_participants"("seasonId", "userId");
CREATE INDEX "season_participants_seasonId_earnedXp_carryoverXp_idx" ON "season_participants"("seasonId", "earnedXp", "carryoverXp");
CREATE INDEX "season_participants_userId_createdAt_idx" ON "season_participants"("userId", "createdAt");
CREATE UNIQUE INDEX "event_registrations_eventId_placement_key" ON "event_registrations"("eventId", "placement");

ALTER TABLE "events" ADD CONSTRAINT "events_participation_hp_check" CHECK ("participationHp" BETWEEN 0 AND 300);
ALTER TABLE "events" ADD CONSTRAINT "events_first_place_hp_check" CHECK ("firstPlaceBonusHp" BETWEEN 0 AND 1500);
ALTER TABLE "events" ADD CONSTRAINT "events_second_place_hp_check" CHECK ("secondPlaceBonusHp" BETWEEN 0 AND 1000);
ALTER TABLE "events" ADD CONSTRAINT "events_third_place_hp_check" CHECK ("thirdPlaceBonusHp" BETWEEN 0 AND 750);
ALTER TABLE "events" ADD CONSTRAINT "events_podium_order_check" CHECK (
  "firstPlaceBonusHp" > "secondPlaceBonusHp" AND
  "secondPlaceBonusHp" > "thirdPlaceBonusHp"
);
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registration_placement_check" CHECK ("placement" IS NULL OR "placement" BETWEEN 1 AND 3);

UPDATE "xp_grants" AS xp_row
SET "seasonId" = season."id"
FROM "leaderboard_seasons" AS season
WHERE xp_row."effectiveAt" >= season."startDate"
  AND xp_row."effectiveAt" <= season."endDate"
  AND xp_row."seasonId" IS NULL;

INSERT INTO "season_participants" (
  "id", "seasonId", "userId", "lifetimeTierAtStart", "earnedXp", "createdAt", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || xp_row."seasonId" || xp_row."userId"),
  xp_row."seasonId",
  xp_row."userId",
  COALESCE(economy."currentTier", 'SPROUT'::"Tier"),
  GREATEST(0, SUM(xp_row."amount"))::integer,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "xp_grants" AS xp_row
LEFT JOIN "user_economies" AS economy ON economy."userId" = xp_row."userId"
WHERE xp_row."seasonId" IS NOT NULL
GROUP BY xp_row."seasonId", xp_row."userId", economy."currentTier"
ON CONFLICT ("seasonId", "userId") DO NOTHING;
