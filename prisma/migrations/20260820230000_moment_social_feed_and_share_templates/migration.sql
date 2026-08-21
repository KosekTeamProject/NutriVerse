ALTER TYPE "PrivacyLevel" ADD VALUE IF NOT EXISTS 'COMMUNITY';

CREATE TYPE "ShareTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ShareTemplateAspectRatio" AS ENUM ('SQUARE', 'PORTRAIT', 'STORY', 'LANDSCAPE');

ALTER TABLE "moments"
  ADD COLUMN "communityId" TEXT,
  ADD COLUMN "shareTemplateId" TEXT,
  ADD COLUMN "shareTemplateVersion" INTEGER,
  ADD COLUMN "metricsSnapshot" JSONB;

CREATE TABLE "moment_comments" (
  "id" TEXT NOT NULL,
  "momentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "moment_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "share_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Aktivitas',
  "aspectRatio" "ShareTemplateAspectRatio" NOT NULL DEFAULT 'SQUARE',
  "width" INTEGER NOT NULL DEFAULT 1080,
  "height" INTEGER NOT NULL DEFAULT 1080,
  "backgroundUrl" TEXT,
  "thumbnailUrl" TEXT,
  "layoutConfig" JSONB NOT NULL,
  "allowedDataKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ShareTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" TEXT NOT NULL,
  "publishedByUserId" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "share_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "moment_comments_momentId_createdAt_idx" ON "moment_comments"("momentId", "createdAt");
CREATE INDEX "moment_comments_userId_createdAt_idx" ON "moment_comments"("userId", "createdAt");
CREATE INDEX "moments_communityId_createdAt_idx" ON "moments"("communityId", "createdAt");
CREATE INDEX "moments_shareTemplateId_idx" ON "moments"("shareTemplateId");
CREATE INDEX "share_templates_status_category_createdAt_idx" ON "share_templates"("status", "category", "createdAt");
CREATE INDEX "share_templates_createdByUserId_idx" ON "share_templates"("createdByUserId");
CREATE INDEX "share_templates_publishedByUserId_idx" ON "share_templates"("publishedByUserId");

ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moments" ADD CONSTRAINT "moments_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "guilds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moments" ADD CONSTRAINT "moments_shareTemplateId_fkey" FOREIGN KEY ("shareTemplateId") REFERENCES "share_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "share_templates" ADD CONSTRAINT "share_templates_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "share_templates" ADD CONSTRAINT "share_templates_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
