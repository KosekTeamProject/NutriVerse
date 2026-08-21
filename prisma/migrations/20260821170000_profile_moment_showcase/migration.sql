ALTER TABLE "moments"
  ADD COLUMN "visibleOnProfile" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "profileDisplayOrder" INTEGER;

CREATE INDEX "moments_userId_visibleOnProfile_profileDisplayOrder_idx"
  ON "moments"("userId", "visibleOnProfile", "profileDisplayOrder");
