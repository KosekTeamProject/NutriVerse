ALTER TABLE "events" ADD COLUMN "guildId" TEXT;
ALTER TABLE "events" ADD CONSTRAINT "events_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "events_guildId_idx" ON "events"("guildId");
