-- ERD completion: canonical food catalogue, guilds, and Healthy Circle.
CREATE TYPE "GuildRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "PostReactionType" AS ENUM ('ENCOURAGE', 'SUPPORT', 'CELEBRATE');

CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'LOCAL',
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "caloriesPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiberPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugarPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodiumMgPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "food_items_nutrients_nonnegative" CHECK (
      "caloriesPer100g" >= 0 AND "proteinPer100g" >= 0 AND
      "carbsPer100g" >= 0 AND "fatPer100g" >= 0 AND
      "fiberPer100g" >= 0 AND "sugarPer100g" >= 0 AND
      "sodiumMgPer100g" >= 0
    )
);

ALTER TABLE "nutrition_entries"
  ADD COLUMN "foodItemId" TEXT,
  ADD COLUMN "portionGrams" DOUBLE PRECISION;

CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emblemUrl" TEXT,
    "leaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guild_members" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GuildRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guild_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'CIRCLE',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "posts_content_or_image_required" CHECK (
      length(btrim("content")) > 0 OR "imageUrl" IS NOT NULL
    )
);

CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_comments_content_required" CHECK (length(btrim("content")) > 0)
);

CREATE TABLE "post_reactions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PostReactionType" NOT NULL DEFAULT 'ENCOURAGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "post_reactions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "content_reports"
  ADD COLUMN "postId" TEXT,
  ADD COLUMN "commentId" TEXT;

CREATE UNIQUE INDEX "food_items_source_externalId_key" ON "food_items"("source", "externalId");
CREATE INDEX "food_items_name_idx" ON "food_items"("name");
CREATE INDEX "nutrition_entries_userId_createdAt_idx" ON "nutrition_entries"("userId", "createdAt");
CREATE INDEX "nutrition_entries_foodItemId_idx" ON "nutrition_entries"("foodItemId");
CREATE UNIQUE INDEX "guilds_name_key" ON "guilds"("name");
CREATE INDEX "guilds_leaderId_idx" ON "guilds"("leaderId");
CREATE UNIQUE INDEX "guild_members_guildId_userId_key" ON "guild_members"("guildId", "userId");
CREATE INDEX "guild_members_userId_idx" ON "guild_members"("userId");
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt");
CREATE INDEX "posts_userId_createdAt_idx" ON "posts"("userId", "createdAt");
CREATE INDEX "posts_guildId_createdAt_idx" ON "posts"("guildId", "createdAt");
CREATE INDEX "post_comments_postId_createdAt_idx" ON "post_comments"("postId", "createdAt");
CREATE INDEX "post_comments_userId_createdAt_idx" ON "post_comments"("userId", "createdAt");
CREATE UNIQUE INDEX "post_reactions_postId_userId_key" ON "post_reactions"("postId", "userId");
CREATE INDEX "post_reactions_userId_createdAt_idx" ON "post_reactions"("userId", "createdAt");
CREATE INDEX "content_reports_reporterUserId_createdAt_idx" ON "content_reports"("reporterUserId", "createdAt");
CREATE INDEX "content_reports_postId_idx" ON "content_reports"("postId");
CREATE INDEX "content_reports_commentId_idx" ON "content_reports"("commentId");

ALTER TABLE "nutrition_entries"
  ADD CONSTRAINT "nutrition_entries_foodItemId_fkey"
  FOREIGN KEY ("foodItemId") REFERENCES "food_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guilds"
  ADD CONSTRAINT "guilds_leaderId_fkey"
  FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guild_members"
  ADD CONSTRAINT "guild_members_guildId_fkey"
  FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guild_members"
  ADD CONSTRAINT "guild_members_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "posts"
  ADD CONSTRAINT "posts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "posts"
  ADD CONSTRAINT "posts_guildId_fkey"
  FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_comments"
  ADD CONSTRAINT "post_comments_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_comments"
  ADD CONSTRAINT "post_comments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_reactions"
  ADD CONSTRAINT "post_reactions_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_reactions"
  ADD CONSTRAINT "post_reactions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_reports"
  ADD CONSTRAINT "content_reports_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_reports"
  ADD CONSTRAINT "content_reports_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
