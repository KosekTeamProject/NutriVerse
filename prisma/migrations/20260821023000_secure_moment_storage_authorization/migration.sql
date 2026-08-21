CREATE OR REPLACE FUNCTION public.can_read_moment_storage_object(
  object_name TEXT,
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
    FROM public.moments moment
    WHERE moment."imageUrl" = object_name
      AND NOT moment."isHidden"
      AND (
        EXISTS (
          SELECT 1 FROM public.users owner
          WHERE owner."id" = moment."userId"
            AND owner."authUserId" = viewer_auth_user_id::text
        )
        OR moment."privacyLevel" = 'PUBLIC'
        OR (
          moment."privacyLevel" = 'CIRCLE'
          AND EXISTS (
            SELECT 1
            FROM public.users viewer
            JOIN public.user_connections connection
              ON connection."status" = 'ACCEPTED'
             AND (
               (connection."requesterId" = viewer."id" AND connection."addresseeId" = moment."userId")
               OR
               (connection."addresseeId" = viewer."id" AND connection."requesterId" = moment."userId")
             )
            WHERE viewer."authUserId" = viewer_auth_user_id::text
          )
        )
        OR (
          moment."privacyLevel" = 'COMMUNITY'
          AND EXISTS (
            SELECT 1
            FROM public.users viewer
            JOIN public.guild_members membership ON membership."userId" = viewer."id"
            JOIN public.guilds guild ON guild."id" = membership."guildId"
            WHERE viewer."authUserId" = viewer_auth_user_id::text
              AND membership."guildId" = moment."communityId"
              AND membership."status" = 'ACTIVE'
              AND guild."approvalStatus" = 'APPROVED'
              AND guild."isActive"
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_moment_storage_object(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_moment_storage_object(TEXT, UUID) TO authenticated;

DROP POLICY IF EXISTS "moments_read_authorized" ON storage.objects;
CREATE POLICY "moments_read_authorized"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'moments'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.can_read_moment_storage_object(name, (SELECT auth.uid()))
  )
);
