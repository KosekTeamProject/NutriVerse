ALTER TABLE "user_notifications"
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "requiresAction" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "processingAt" TIMESTAMP(3),
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "actionUrl" TEXT,
  ADD COLUMN "actionKey" TEXT,
  ADD COLUMN "dedupeKey" TEXT;

-- Preserve the meaning of legacy rows that were already marked as read.
UPDATE "user_notifications"
SET "readAt" = "createdAt"
WHERE "isRead" = true AND "readAt" IS NULL;

CREATE INDEX "user_notifications_userId_archivedAt_createdAt_idx"
  ON "user_notifications"("userId", "archivedAt", "createdAt");

CREATE INDEX "user_notifications_userId_actionKey_resolvedAt_idx"
  ON "user_notifications"("userId", "actionKey", "resolvedAt");

CREATE UNIQUE INDEX "user_notifications_dedupeKey_key"
  ON "user_notifications"("dedupeKey");
