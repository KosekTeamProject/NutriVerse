-- Separate long-lived communities from scheduled events while retaining legacy guild data.
CREATE TYPE "CommunityApprovalStatus" AS ENUM ('PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "CommunityJoinPolicy" AS ENUM ('OPEN', 'APPROVAL');
CREATE TYPE "CommunityMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BANNED');

ALTER TABLE "guilds"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Gaya Hidup Sehat',
  ADD COLUMN "rules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "joinPolicy" "CommunityJoinPolicy" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "approvalStatus" "CommunityApprovalStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "reviewedByUserId" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "guilds" SET "approvedAt" = COALESCE("approvedAt", "createdAt") WHERE "approvalStatus" = 'APPROVED';

ALTER TABLE "guild_members"
  ADD COLUMN "status" "CommunityMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "visibleOnProfile" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "guild_members" SET "approvedAt" = COALESCE("approvedAt", "joinedAt") WHERE "status" = 'ACTIVE';

ALTER TABLE "posts" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "guilds_approvalStatus_isActive_createdAt_idx" ON "guilds"("approvalStatus", "isActive", "createdAt");
CREATE INDEX "guilds_reviewedByUserId_idx" ON "guilds"("reviewedByUserId");
CREATE INDEX "guild_members_userId_status_idx" ON "guild_members"("userId", "status");
CREATE INDEX "guild_members_guildId_status_idx" ON "guild_members"("guildId", "status");

ALTER TABLE "guilds"
  ADD CONSTRAINT "guilds_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
