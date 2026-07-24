-- Browser-side Supabase access is denied by default, then selectively enabled.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "health_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companion_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_economies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "telemetry_samples" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nutrition_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "water_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_food_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "health_pulses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "health_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "challenge_progresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "challenge_contributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journey_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_reactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_self" ON "users" FOR SELECT
  USING ("authUserId" = (SELECT auth.uid())::text);
CREATE POLICY "users_update_self" ON "users" FOR UPDATE
  USING ("authUserId" = (SELECT auth.uid())::text)
  WITH CHECK ("authUserId" = (SELECT auth.uid())::text);

CREATE POLICY "health_profiles_self" ON "health_profiles" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "companion_preferences_self" ON "companion_preferences" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "user_settings_self" ON "user_settings" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

CREATE POLICY "user_economies_read_self" ON "user_economies" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "activity_sessions_read_self" ON "activity_sessions" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "telemetry_samples_read_self" ON "telemetry_samples" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "activity_sessions" a
    JOIN "users" u ON u."id" = a."userId"
    WHERE a."id" = "activitySessionId" AND u."authUserId" = (SELECT auth.uid())::text
  ));
CREATE POLICY "verification_results_read_self" ON "verification_results" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "activity_sessions" a
    JOIN "users" u ON u."id" = a."userId"
    WHERE a."id" = "activitySessionId" AND u."authUserId" = (SELECT auth.uid())::text
  ));

CREATE POLICY "nutrition_entries_self" ON "nutrition_entries" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "water_logs_self" ON "water_logs" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "custom_food_items_visible" ON "custom_food_items" FOR SELECT
  USING ("isPublic" OR EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "custom_food_items_write_self" ON "custom_food_items" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "health_pulses_self" ON "health_pulses" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "health_metrics_self" ON "health_metrics" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

CREATE POLICY "challenge_progresses_read_self" ON "challenge_progresses" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "challenge_contributions_read_self" ON "challenge_contributions" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "user_badges_read_self" ON "user_badges" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "redemptions_read_self" ON "redemptions" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

CREATE POLICY "journal_entries_self" ON "journal_entries" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "journey_entries_self" ON "journey_entries" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

CREATE POLICY "posts_visible" ON "posts" FOR SELECT
  USING (
    NOT "isHidden" AND (
      "privacyLevel" = 'PUBLIC' OR
      EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text)
    )
  );
CREATE POLICY "posts_write_self" ON "posts" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "post_comments_visible" ON "post_comments" FOR SELECT
  USING (NOT "isHidden");
CREATE POLICY "post_comments_write_self" ON "post_comments" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));
CREATE POLICY "post_reactions_self" ON "post_reactions" FOR ALL
  USING (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "userId" AND u."authUserId" = (SELECT auth.uid())::text));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('activity-shares', 'activity-shares', false, 10485760, ARRAY['image/png'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "storage_public_images_read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'post-images'));
CREATE POLICY "storage_owner_read_private" ON storage.objects FOR SELECT
  USING (bucket_id = 'activity-shares' AND owner_id = (SELECT auth.uid()::text));
CREATE POLICY "storage_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('avatars', 'post-images', 'activity-shares') AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
CREATE POLICY "storage_owner_update" ON storage.objects FOR UPDATE
  USING (owner_id = (SELECT auth.uid()::text))
  WITH CHECK (owner_id = (SELECT auth.uid()::text));
CREATE POLICY "storage_owner_delete" ON storage.objects FOR DELETE
  USING (owner_id = (SELECT auth.uid()::text));
