CREATE TYPE "MomentLikerListVisibility" AS ENUM ('AUDIENCE', 'OWNER_ONLY');
CREATE TYPE "MomentCommentMode" AS ENUM ('AUDIENCE', 'FRIENDS_ONLY', 'OFF');

ALTER TABLE "user_settings"
  ADD COLUMN "notificationsMomentLikes" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notificationsMomentComments" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notificationsCommunity" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "defaultMomentShowLikeCount" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "defaultMomentLikerList" "MomentLikerListVisibility" NOT NULL DEFAULT 'AUDIENCE',
  ADD COLUMN "defaultMomentComments" "MomentCommentMode" NOT NULL DEFAULT 'AUDIENCE',
  ADD COLUMN "momentHiddenWords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "moments"
  ADD COLUMN "showLikeCount" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "likerListVisibility" "MomentLikerListVisibility" NOT NULL DEFAULT 'AUDIENCE',
  ADD COLUMN "commentsMode" "MomentCommentMode" NOT NULL DEFAULT 'AUDIENCE',
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "moment_bookmarks" (
  "id" TEXT NOT NULL,
  "momentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moment_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_mutes" (
  "id" TEXT NOT NULL,
  "muterId" TEXT NOT NULL,
  "mutedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_mutes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "moment_bookmarks_momentId_userId_key" ON "moment_bookmarks"("momentId", "userId");
CREATE INDEX "moment_bookmarks_userId_createdAt_idx" ON "moment_bookmarks"("userId", "createdAt");
CREATE UNIQUE INDEX "user_mutes_muterId_mutedId_key" ON "user_mutes"("muterId", "mutedId");
CREATE INDEX "user_mutes_mutedId_idx" ON "user_mutes"("mutedId");
CREATE INDEX "moments_userId_isArchived_createdAt_idx" ON "moments"("userId", "isArchived", "createdAt");

ALTER TABLE "moment_bookmarks"
  ADD CONSTRAINT "moment_bookmarks_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "moment_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_mutes"
  ADD CONSTRAINT "user_mutes_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_mutes_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
