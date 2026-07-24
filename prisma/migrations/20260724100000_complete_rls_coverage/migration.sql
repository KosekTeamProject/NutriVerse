ALTER TABLE "user_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_device_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "xp_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hp_ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appeals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companion_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companion_memories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weekly_letter_archives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leaderboard_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rankings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "food_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nutrition_search_caches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guilds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guild_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "moments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notifications_self" ON "user_notifications" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "user_device_tokens_self" ON "user_device_tokens" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "xp_grants_read_self" ON "xp_grants" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "hp_ledger_read_self" ON "hp_ledger_entries" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "appeals_self" ON "appeals" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "companion_conversations_self" ON "companion_conversations" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "companion_memories_self" ON "companion_memories" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "weekly_letters_self" ON "weekly_letter_archives" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

CREATE POLICY "challenges_read_authenticated" ON "challenges" FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_read_authenticated" ON "badges" FOR SELECT TO authenticated USING (true);
CREATE POLICY "seasons_read_authenticated" ON "leaderboard_seasons" FOR SELECT TO authenticated USING (true);
CREATE POLICY "rankings_read_authenticated" ON "rankings" FOR SELECT TO authenticated USING (true);
CREATE POLICY "rewards_read_authenticated" ON "rewards" FOR SELECT TO authenticated USING ("isActive");
CREATE POLICY "food_items_read_authenticated" ON "food_items" FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_read_authenticated" ON "events" FOR SELECT TO authenticated USING (true);
CREATE POLICY "guilds_read_authenticated" ON "guilds" FOR SELECT TO authenticated USING (true);
CREATE POLICY "guild_members_read_authenticated" ON "guild_members" FOR SELECT TO authenticated USING (true);

CREATE POLICY "journal_attachments_owner" ON "journal_attachments" FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "journal_entries" j JOIN "users" u ON u."id" = j."userId"
    WHERE j."id" = "journalEntryId" AND u."authUserId" = (SELECT auth.uid())::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "journal_entries" j JOIN "users" u ON u."id" = j."userId"
    WHERE j."id" = "journalEntryId" AND u."authUserId" = (SELECT auth.uid())::text
  ));
CREATE POLICY "journal_reactions_owner" ON "journal_reactions" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

CREATE POLICY "moments_visible" ON "moments" FOR SELECT
  USING (
    "privacyLevel" = 'PUBLIC' OR
    EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text)
  );
CREATE POLICY "moments_write_self" ON "moments" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "reports_read_self" ON "content_reports" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "reporterUserId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "reports_insert_self" ON "content_reports" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "reporterUserId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "audit_admin_read" ON "audit_logs" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."authUserId" = (SELECT auth.uid())::text
      AND u."role" IN ('ADMIN', 'MODERATOR')
  ));
