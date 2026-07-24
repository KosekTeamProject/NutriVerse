CREATE TYPE "ActivityProcessingStatus" AS ENUM (
  'TRACKING',
  'VERIFYING',
  'REWARDING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE "EventRegistrationStatus" AS ENUM (
  'JOINED',
  'CANCELLED',
  'ATTENDED'
);

CREATE TYPE "ConnectionStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'BLOCKED'
);

ALTER TYPE "LedgerType" ADD VALUE IF NOT EXISTS 'HP_REFUND';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTIVITY';

ALTER TABLE "users"
  ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT;

ALTER TABLE "user_settings"
  ADD COLUMN "leaderboardRegion" TEXT,
  ADD COLUMN "rawGpsRetentionDays" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "user_device_tokens"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "user_economies"
  ADD COLUMN "hpDebt" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "xp_grants"
  ADD COLUMN "type" "LedgerType" NOT NULL DEFAULT 'XP_GRANT';

ALTER TABLE "activity_sessions"
  ADD COLUMN "processingStatus" "ActivityProcessingStatus" NOT NULL DEFAULT 'TRACKING',
  ADD COLUMN "processingAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastProcessingError" TEXT,
  ADD COLUMN "rewardProcessedAt" TIMESTAMP(3),
  ADD COLUMN "challengeProcessedAt" TIMESTAMP(3),
  ADD COLUMN "badgeProcessedAt" TIMESTAMP(3),
  ADD COLUMN "finalizedAt" TIMESTAMP(3),
  ADD COLUMN "processingLeaseToken" TEXT,
  ADD COLUMN "processingLeaseUntil" TIMESTAMP(3),
  ADD COLUMN "telemetrySampleCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "activity_sessions" activity
SET "telemetrySampleCount" = (
  SELECT COUNT(*)::INTEGER
  FROM "telemetry_samples" sample
  WHERE sample."activitySessionId" = activity."id"
);

UPDATE "activity_sessions"
SET
  "processingStatus" = CASE
    WHEN "endTime" IS NULL THEN 'TRACKING'::"ActivityProcessingStatus"
    WHEN "verificationStatus" = 'PENDING' THEN 'VERIFYING'::"ActivityProcessingStatus"
    ELSE 'COMPLETED'::"ActivityProcessingStatus"
  END,
  "finalizedAt" = CASE
    WHEN "endTime" IS NOT NULL AND "verificationStatus" <> 'PENDING' THEN "updatedAt"
    ELSE NULL
  END;

ALTER TABLE "challenge_progresses"
  ADD COLUMN "claimVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "rewardReversedAt" TIMESTAMP(3);

ALTER TABLE "redemptions"
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "fulfillmentReference" TEXT,
  ADD COLUMN "statusReason" TEXT;

ALTER TABLE "events"
  ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bonusXp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bonusHp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "moments"
  ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "event_registrations" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "EventRegistrationStatus" NOT NULL DEFAULT 'JOINED',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attendedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_connections" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "addresseeId" TEXT NOT NULL,
  "blockedById" TEXT,
  "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "moment_reactions" (
  "id" TEXT NOT NULL,
  "momentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "PostReactionType" NOT NULL DEFAULT 'ENCOURAGE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moment_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_rate_limit_buckets" (
  "id" TEXT NOT NULL,
  "bucketKey" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_registrations_eventId_userId_key"
  ON "event_registrations"("eventId", "userId");
CREATE INDEX "event_registrations_userId_status_idx"
  ON "event_registrations"("userId", "status");

CREATE UNIQUE INDEX "user_connections_requesterId_addresseeId_key"
  ON "user_connections"("requesterId", "addresseeId");
CREATE INDEX "user_connections_addresseeId_status_idx"
  ON "user_connections"("addresseeId", "status");
CREATE INDEX "user_connections_requesterId_status_idx"
  ON "user_connections"("requesterId", "status");
CREATE INDEX "user_connections_blockedById_idx"
  ON "user_connections"("blockedById");

CREATE UNIQUE INDEX "moment_reactions_momentId_userId_key"
  ON "moment_reactions"("momentId", "userId");
CREATE INDEX "moment_reactions_userId_createdAt_idx"
  ON "moment_reactions"("userId", "createdAt");

CREATE UNIQUE INDEX "api_rate_limit_buckets_bucketKey_windowStart_key"
  ON "api_rate_limit_buckets"("bucketKey", "windowStart");
CREATE INDEX "api_rate_limit_buckets_expiresAt_idx"
  ON "api_rate_limit_buckets"("expiresAt");

CREATE INDEX "user_device_tokens_userId_updatedAt_idx"
  ON "user_device_tokens"("userId", "updatedAt");
CREATE INDEX "activity_sessions_processingStatus_updatedAt_idx"
  ON "activity_sessions"("processingStatus", "updatedAt");
CREATE INDEX "events_isActive_startDate_idx"
  ON "events"("isActive", "startDate");
CREATE INDEX "moments_privacyLevel_createdAt_idx"
  ON "moments"("privacyLevel", "createdAt");
CREATE INDEX "moments_userId_createdAt_idx"
  ON "moments"("userId", "createdAt");

WITH duplicates AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "reporterUserId", "momentId"
    ORDER BY "createdAt", "id"
  ) AS row_number
  FROM "content_reports"
  WHERE "momentId" IS NOT NULL
)
DELETE FROM "content_reports"
WHERE "id" IN (
  SELECT "id" FROM duplicates WHERE row_number > 1
);
WITH duplicates AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "reporterUserId", "postId"
    ORDER BY "createdAt", "id"
  ) AS row_number
  FROM "content_reports"
  WHERE "postId" IS NOT NULL
)
DELETE FROM "content_reports"
WHERE "id" IN (
  SELECT "id" FROM duplicates WHERE row_number > 1
);
WITH duplicates AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "reporterUserId", "commentId"
    ORDER BY "createdAt", "id"
  ) AS row_number
  FROM "content_reports"
  WHERE "commentId" IS NOT NULL
)
DELETE FROM "content_reports"
WHERE "id" IN (
  SELECT "id" FROM duplicates WHERE row_number > 1
);

CREATE UNIQUE INDEX "content_reports_reporterUserId_momentId_key"
  ON "content_reports"("reporterUserId", "momentId");
CREATE UNIQUE INDEX "content_reports_reporterUserId_postId_key"
  ON "content_reports"("reporterUserId", "postId");
CREATE UNIQUE INDEX "content_reports_reporterUserId_commentId_key"
  ON "content_reports"("reporterUserId", "commentId");

ALTER TABLE "event_registrations"
  ADD CONSTRAINT "event_registrations_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_registrations"
  ADD CONSTRAINT "event_registrations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_connections"
  ADD CONSTRAINT "user_connections_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_connections"
  ADD CONSTRAINT "user_connections_addresseeId_fkey"
  FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_connections"
  ADD CONSTRAINT "user_connections_blockedById_fkey"
  FOREIGN KEY ("blockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "moment_reactions"
  ADD CONSTRAINT "moment_reactions_momentId_fkey"
  FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moment_reactions"
  ADD CONSTRAINT "moment_reactions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_settings"
  ADD CONSTRAINT "user_settings_rawGpsRetentionDays_check"
  CHECK ("rawGpsRetentionDays" BETWEEN 1 AND 3650);
ALTER TABLE "user_economies"
  ADD CONSTRAINT "user_economies_hpDebt_check"
  CHECK ("hpDebt" >= 0);
ALTER TABLE "events"
  ADD CONSTRAINT "events_capacity_check" CHECK ("capacity" >= 0),
  ADD CONSTRAINT "events_bonusXp_check" CHECK ("bonusXp" >= 0),
  ADD CONSTRAINT "events_bonusHp_check" CHECK ("bonusHp" >= 0);
ALTER TABLE "user_connections"
  ADD CONSTRAINT "user_connections_distinct_users_check"
  CHECK ("requesterId" <> "addresseeId");
ALTER TABLE "api_rate_limit_buckets"
  ADD CONSTRAINT "api_rate_limit_buckets_count_check"
  CHECK ("count" > 0);
ALTER TABLE "activity_sessions"
  ADD CONSTRAINT "activity_sessions_telemetrySampleCount_check"
  CHECK ("telemetrySampleCount" BETWEEN 0 AND 50000) NOT VALID;

ALTER TABLE "event_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "moment_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_rate_limit_buckets" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_registrations_read_self"
  ON "event_registrations" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."id" = "userId"
      AND u."authUserId" = (SELECT auth.uid())::text
  ));
CREATE POLICY "user_connections_read_participant"
  ON "user_connections" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."authUserId" = (SELECT auth.uid())::text
      AND u."id" IN ("requesterId", "addresseeId")
  ));
CREATE POLICY "moment_reactions_read_self"
  ON "moment_reactions" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."id" = "userId"
      AND u."authUserId" = (SELECT auth.uid())::text
  ));

DROP POLICY IF EXISTS "posts_visible" ON "posts";
CREATE POLICY "posts_visible" ON "posts" FOR SELECT
  USING (
    NOT "isHidden" AND (
      EXISTS (
        SELECT 1 FROM "users" owner
        WHERE owner."id" = "posts"."userId"
          AND owner."authUserId" = (SELECT auth.uid())::text
      )
      OR "privacyLevel" = 'PUBLIC'
      OR (
        "privacyLevel" = 'CIRCLE'
        AND EXISTS (
          SELECT 1
          FROM "users" viewer
          JOIN "user_connections" connection
            ON connection."status" = 'ACCEPTED'
           AND (
             (connection."requesterId" = viewer."id"
               AND connection."addresseeId" = "posts"."userId")
             OR
             (connection."addresseeId" = viewer."id"
               AND connection."requesterId" = "posts"."userId")
           )
          WHERE viewer."authUserId" = (SELECT auth.uid())::text
        )
      )
      OR (
        "privacyLevel" <> 'PRIVATE'
        AND "posts"."guildId" IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM "users" viewer
          JOIN "guild_members" membership
            ON membership."userId" = viewer."id"
           AND membership."guildId" = "posts"."guildId"
          WHERE viewer."authUserId" = (SELECT auth.uid())::text
        )
      )
    )
  );

DROP POLICY IF EXISTS "post_comments_visible" ON "post_comments";
CREATE POLICY "post_comments_visible" ON "post_comments" FOR SELECT
  USING (
    NOT "isHidden"
    AND EXISTS (
      SELECT 1 FROM "posts" post
      WHERE post."id" = "post_comments"."postId"
    )
  );

DROP POLICY IF EXISTS "moments_visible" ON "moments";
CREATE POLICY "moments_visible" ON "moments" FOR SELECT
  USING (
    NOT "isHidden" AND (
      EXISTS (
        SELECT 1 FROM "users" owner
        WHERE owner."id" = "moments"."userId"
          AND owner."authUserId" = (SELECT auth.uid())::text
      )
      OR "privacyLevel" = 'PUBLIC'
      OR (
        "privacyLevel" = 'CIRCLE'
        AND EXISTS (
          SELECT 1
          FROM "users" viewer
          JOIN "user_connections" connection
            ON connection."status" = 'ACCEPTED'
           AND (
             (connection."requesterId" = viewer."id"
               AND connection."addresseeId" = "moments"."userId")
             OR
             (connection."addresseeId" = viewer."id"
               AND connection."requesterId" = "moments"."userId")
           )
          WHERE viewer."authUserId" = (SELECT auth.uid())::text
        )
      )
    )
  );

DROP POLICY IF EXISTS "events_read_authenticated" ON "events";
CREATE POLICY "events_read_authenticated" ON "events"
  FOR SELECT TO authenticated
  USING ("isActive");

DROP POLICY IF EXISTS "rankings_read_authenticated" ON "rankings";
CREATE POLICY "rankings_read_authenticated" ON "rankings"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM "users" ranked_user
    JOIN "user_settings" settings
      ON settings."userId" = ranked_user."id"
    WHERE ranked_user."id" = "rankings"."userId"
      AND NOT ranked_user."isSuspended"
      AND settings."leaderboardVisible"
  ));

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'journal-attachments',
  'journal-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "storage_owner_read_private" ON storage.objects;
CREATE POLICY "storage_owner_read_private"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('activity-shares', 'journal-attachments')
    AND owner_id = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "storage_owner_insert" ON storage.objects;
CREATE POLICY "storage_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN (
      'avatars',
      'post-images',
      'activity-shares',
      'journal-attachments'
    )
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
