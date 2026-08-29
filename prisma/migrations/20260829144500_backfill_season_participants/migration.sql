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
ON CONFLICT ("seasonId", "userId") DO UPDATE
SET "earnedXp" = EXCLUDED."earnedXp", "updatedAt" = CURRENT_TIMESTAMP;
