ALTER TABLE "journal_entries"
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Catatan kesehatan',
ADD COLUMN "allowCompanion" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "moments"
ADD COLUMN "duringActivity" BOOLEAN NOT NULL DEFAULT false;
