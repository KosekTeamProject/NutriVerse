/*
  Warnings:

  - A unique constraint covering the columns `[userId,pulseDate]` on the table `health_pulses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CompanionSender" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'REMINDER', 'CHALLENGE', 'CHEAT_ALERT', 'WEEKLY_LETTER', 'REWARD');

-- AlterTable
ALTER TABLE "health_pulses" ALTER COLUMN "pulseDate" SET DATA TYPE DATE;

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'ANDROID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sender" "CompanionSender" NOT NULL,
    "content" TEXT NOT NULL,
    "emotionContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryKey" TEXT NOT NULL,
    "memoryValue" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "importance" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_letter_archives" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "letterTitle" TEXT NOT NULL,
    "letterContent" TEXT NOT NULL,
    "summaryJson" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_letter_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_attachments" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'IMAGE',

    CONSTRAINT "journal_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_reactions" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "volumeMl" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_food_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caloriesPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_search_caches" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_search_caches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_userId_isRead_idx" ON "user_notifications"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "user_device_tokens_fcmToken_key" ON "user_device_tokens"("fcmToken");

-- CreateIndex
CREATE INDEX "companion_conversations_userId_createdAt_idx" ON "companion_conversations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "weekly_letter_archives_userId_weekStart_idx" ON "weekly_letter_archives"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "journal_reactions_journalEntryId_userId_key" ON "journal_reactions"("journalEntryId", "userId");

-- CreateIndex
CREATE INDEX "water_logs_userId_loggedAt_idx" ON "water_logs"("userId", "loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_search_caches_queryHash_key" ON "nutrition_search_caches"("queryHash");

-- CreateIndex
CREATE INDEX "nutrition_search_caches_queryHash_idx" ON "nutrition_search_caches"("queryHash");

-- CreateIndex
CREATE INDEX "health_pulses_userId_pulseDate_idx" ON "health_pulses"("userId", "pulseDate");

-- CreateIndex
CREATE UNIQUE INDEX "health_pulses_userId_pulseDate_key" ON "health_pulses"("userId", "pulseDate");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_tokens" ADD CONSTRAINT "user_device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_conversations" ADD CONSTRAINT "companion_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_memories" ADD CONSTRAINT "companion_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_letter_archives" ADD CONSTRAINT "weekly_letter_archives_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_attachments" ADD CONSTRAINT "journal_attachments_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_reactions" ADD CONSTRAINT "journal_reactions_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_reactions" ADD CONSTRAINT "journal_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_food_items" ADD CONSTRAINT "custom_food_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
