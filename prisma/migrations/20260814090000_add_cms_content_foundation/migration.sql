-- CMS publication lifecycle shared by editorial content and events.
CREATE TYPE "CmsPublicationStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EDITOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AUTHOR';

ALTER TABLE "events"
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "updatedByUserId" TEXT;

CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE INDEX "events_status_startDate_idx" ON "events"("status", "startDate");

CREATE TABLE "cms_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cms_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_categories_slug_key" ON "cms_categories"("slug");

CREATE TABLE "cms_articles" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImageUrl" TEXT,
  "status" "CmsPublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "categoryId" TEXT,
  "authorUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT,
  "publishedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cms_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_articles_slug_key" ON "cms_articles"("slug");
CREATE INDEX "cms_articles_status_publishedAt_idx" ON "cms_articles"("status", "publishedAt");
CREATE INDEX "cms_articles_categoryId_status_idx" ON "cms_articles"("categoryId", "status");

CREATE TABLE "cms_media" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "altText" TEXT,
  "articleId" TEXT,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cms_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_media_storagePath_key" ON "cms_media"("storagePath");
CREATE INDEX "cms_media_articleId_createdAt_idx" ON "cms_media"("articleId", "createdAt");

ALTER TABLE "cms_articles"
  ADD CONSTRAINT "cms_articles_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "cms_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_articles_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_articles_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_articles_publishedByUserId_fkey"
  FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cms_articles"
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "autosavedAt" TIMESTAMP(3);

CREATE TABLE "cms_article_revisions" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImageUrl" TEXT,
  "status" "CmsPublicationStatus" NOT NULL,
  "savedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cms_article_revisions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cms_article_revisions_articleId_version_key" ON "cms_article_revisions"("articleId", "version");
CREATE INDEX "cms_article_revisions_articleId_createdAt_idx" ON "cms_article_revisions"("articleId", "createdAt");

CREATE TABLE "cms_article_status_history" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "fromStatus" "CmsPublicationStatus",
  "toStatus" "CmsPublicationStatus" NOT NULL,
  "reason" TEXT,
  "changedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cms_article_status_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cms_article_status_history_articleId_createdAt_idx" ON "cms_article_status_history"("articleId", "createdAt");

ALTER TABLE "cms_article_revisions"
  ADD CONSTRAINT "cms_article_revisions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "cms_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_article_revisions_savedByUserId_fkey" FOREIGN KEY ("savedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cms_article_status_history"
  ADD CONSTRAINT "cms_article_status_history_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "cms_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_article_status_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cms_media"
  ADD CONSTRAINT "cms_media_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "cms_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_media_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "cms_tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cms_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_tags_slug_key" ON "cms_tags"("slug");

CREATE TABLE "cms_article_tags" (
  "articleId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "cms_article_tags_pkey" PRIMARY KEY ("articleId", "tagId")
);

CREATE INDEX "cms_article_tags_tagId_idx" ON "cms_article_tags"("tagId");

ALTER TABLE "cms_article_tags"
  ADD CONSTRAINT "cms_article_tags_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "cms_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "cms_article_tags_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "cms_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
