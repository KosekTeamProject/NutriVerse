-- Link an application profile to the canonical Supabase Auth identity.
-- The column stays nullable until existing demo/legacy rows have been reconciled.
ALTER TABLE "users" ADD COLUMN "authUserId" TEXT;

CREATE UNIQUE INDEX "users_authUserId_key" ON "users"("authUserId");
