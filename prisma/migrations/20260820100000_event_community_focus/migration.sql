CREATE TYPE "EventApprovalStatus" AS ENUM (
  'PENDING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE "ExternalLinkStatus" AS ENUM (
  'NONE',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'DISABLED'
);

CREATE TYPE "EventCommentStatus" AS ENUM ('VISIBLE', 'HIDDEN');

ALTER TABLE "users" ADD COLUMN "usernameUpdatedAt" TIMESTAMP(3);

ALTER TABLE "events"
  ADD COLUMN "approvalStatus" "EventApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedByUserId" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "whatsappInviteUrl" TEXT,
  ADD COLUMN "whatsappLinkStatus" "ExternalLinkStatus" NOT NULL DEFAULT 'NONE';

CREATE TABLE "event_comments" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "parentId" TEXT,
  "content" TEXT NOT NULL,
  "status" "EventCommentStatus" NOT NULL DEFAULT 'VISIBLE',
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "moderatedById" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "events"
  ADD CONSTRAINT "events_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "events_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "event_comments"
  ADD CONSTRAINT "event_comments_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "event_comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "event_comments_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "event_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "event_comments_moderatedById_fkey"
  FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "events_approvalStatus_createdAt_idx" ON "events"("approvalStatus", "createdAt");
CREATE INDEX "events_createdByUserId_approvalStatus_idx" ON "events"("createdByUserId", "approvalStatus");
CREATE INDEX "event_comments_eventId_isPinned_createdAt_idx" ON "event_comments"("eventId", "isPinned", "createdAt");
CREATE INDEX "event_comments_authorId_createdAt_idx" ON "event_comments"("authorId", "createdAt");
CREATE INDEX "event_comments_parentId_idx" ON "event_comments"("parentId");
ALTER TABLE "event_comments" ENABLE ROW LEVEL SECURITY;

-- Moments are no longer public community posts. Existing public moments are
-- returned to their owners and new moments default to private.
UPDATE "moments" SET "privacyLevel" = 'PRIVATE' WHERE "privacyLevel" = 'PUBLIC';
ALTER TABLE "moments" ALTER COLUMN "privacyLevel" SET DEFAULT 'PRIVATE';
