-- Fast case-insensitive discovery search without loading whole collections.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "guilds_name_trgm_idx" ON "guilds" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "guilds_category_trgm_idx" ON "guilds" USING GIN ("category" gin_trgm_ops);
CREATE INDEX "guilds_description_trgm_idx" ON "guilds" USING GIN ("description" gin_trgm_ops);

CREATE INDEX "events_title_trgm_idx" ON "events" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "events_description_trgm_idx" ON "events" USING GIN ("description" gin_trgm_ops);
CREATE INDEX "events_location_trgm_idx" ON "events" USING GIN ("location" gin_trgm_ops);
