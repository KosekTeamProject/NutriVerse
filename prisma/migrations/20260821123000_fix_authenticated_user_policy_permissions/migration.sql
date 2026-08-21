CREATE OR REPLACE FUNCTION public.is_current_app_user(
  app_user_id TEXT,
  viewer_auth_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users app_user
    WHERE app_user."id" = app_user_id
      AND app_user."authUserId" = viewer_auth_user_id::text
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_app_admin(
  viewer_auth_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users app_user
    WHERE app_user."authUserId" = viewer_auth_user_id::text
      AND app_user."role" IN ('ADMIN', 'MODERATOR')
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_app_user(TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_app_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_app_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_app_admin(UUID) TO authenticated;

DROP POLICY IF EXISTS "moments_visible" ON public.moments;
CREATE POLICY "moments_visible"
ON public.moments
FOR SELECT
TO authenticated
USING (
  public.can_read_moment_storage_object("imageUrl", (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "moments_write_self" ON public.moments;
CREATE POLICY "moments_write_self"
ON public.moments
FOR ALL
TO authenticated
USING (
  public.is_current_app_user("userId", (SELECT auth.uid()))
)
WITH CHECK (
  public.is_current_app_user("userId", (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "moment_comments_write_self" ON public.moment_comments;
CREATE POLICY "moment_comments_write_self"
ON public.moment_comments
FOR ALL
TO authenticated
USING (
  public.is_current_app_user("userId", (SELECT auth.uid()))
)
WITH CHECK (
  public.is_current_app_user("userId", (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "share_templates_read_published" ON public.share_templates;
CREATE POLICY "share_templates_read_published"
ON public.share_templates
FOR SELECT
TO authenticated
USING (
  "status" = 'PUBLISHED'
  OR public.is_current_app_admin((SELECT auth.uid()))
);

DROP POLICY IF EXISTS "share_templates_admin_write" ON public.share_templates;
CREATE POLICY "share_templates_admin_write"
ON public.share_templates
FOR ALL
TO authenticated
USING (public.is_current_app_admin((SELECT auth.uid())))
WITH CHECK (public.is_current_app_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "share_templates_admin_insert" ON storage.objects;
CREATE POLICY "share_templates_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'share-templates'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND public.is_current_app_admin((SELECT auth.uid()))
);

DROP POLICY IF EXISTS "share_templates_admin_delete" ON storage.objects;
CREATE POLICY "share_templates_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'share-templates'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  AND public.is_current_app_admin((SELECT auth.uid()))
);
