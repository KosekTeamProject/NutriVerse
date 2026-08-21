ALTER TABLE "moment_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "share_templates" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moments_visible" ON "moments";
CREATE POLICY "moments_visible" ON "moments" FOR SELECT
  USING (
    NOT "isHidden" AND (
      EXISTS (
        SELECT 1 FROM "users" owner
        WHERE owner."id" = "moments"."userId"
          AND owner."authUserId" = (SELECT auth.uid())::text
      )
      OR "privacyLevel" = 'PUBLIC'
      OR (
        "privacyLevel" = 'CIRCLE'
        AND EXISTS (
          SELECT 1
          FROM "users" viewer
          JOIN "user_connections" connection
            ON connection."status" = 'ACCEPTED'
           AND (
             (connection."requesterId" = viewer."id" AND connection."addresseeId" = "moments"."userId")
             OR
             (connection."addresseeId" = viewer."id" AND connection."requesterId" = "moments"."userId")
           )
          WHERE viewer."authUserId" = (SELECT auth.uid())::text
        )
      )
      OR (
        "privacyLevel" = 'COMMUNITY'
        AND EXISTS (
          SELECT 1
          FROM "users" viewer
          JOIN "guild_members" membership ON membership."userId" = viewer."id"
          JOIN "guilds" guild ON guild."id" = membership."guildId"
          WHERE viewer."authUserId" = (SELECT auth.uid())::text
            AND membership."guildId" = "moments"."communityId"
            AND membership."status" = 'ACTIVE'
            AND guild."approvalStatus" = 'APPROVED'
            AND guild."isActive"
        )
      )
    )
  );

DROP POLICY IF EXISTS "moment_comments_visible" ON "moment_comments";
CREATE POLICY "moment_comments_visible" ON "moment_comments" FOR SELECT TO authenticated
  USING (
    NOT "isHidden"
    AND EXISTS (SELECT 1 FROM "moments" moment WHERE moment."id" = "moment_comments"."momentId")
  );

DROP POLICY IF EXISTS "moment_comments_write_self" ON "moment_comments";
CREATE POLICY "moment_comments_write_self" ON "moment_comments" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "users" author WHERE author."id" = "moment_comments"."userId" AND author."authUserId" = (SELECT auth.uid())::text))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" author WHERE author."id" = "moment_comments"."userId" AND author."authUserId" = (SELECT auth.uid())::text));

DROP POLICY IF EXISTS "share_templates_read_published" ON "share_templates";
CREATE POLICY "share_templates_read_published" ON "share_templates" FOR SELECT TO authenticated
  USING (
    "status" = 'PUBLISHED'
    OR EXISTS (
      SELECT 1 FROM "users" admin_user
      WHERE admin_user."authUserId" = (SELECT auth.uid())::text
        AND admin_user."role" IN ('ADMIN', 'MODERATOR')
    )
  );

DROP POLICY IF EXISTS "share_templates_admin_write" ON "share_templates";
CREATE POLICY "share_templates_admin_write" ON "share_templates" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "users" admin_user WHERE admin_user."authUserId" = (SELECT auth.uid())::text AND admin_user."role" IN ('ADMIN', 'MODERATOR')))
  WITH CHECK (EXISTS (SELECT 1 FROM "users" admin_user WHERE admin_user."authUserId" = (SELECT auth.uid())::text AND admin_user."role" IN ('ADMIN', 'MODERATOR')));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('share-templates', 'share-templates', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "share_templates_admin_insert" ON storage.objects;
CREATE POLICY "share_templates_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'share-templates'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user."authUserId" = (SELECT auth.uid())::text
        AND admin_user."role" IN ('ADMIN', 'MODERATOR')
    )
  );

DROP POLICY IF EXISTS "share_templates_admin_delete" ON storage.objects;
CREATE POLICY "share_templates_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'share-templates'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM public.users admin_user
      WHERE admin_user."authUserId" = (SELECT auth.uid())::text
        AND admin_user."role" IN ('ADMIN', 'MODERATOR')
    )
  );
