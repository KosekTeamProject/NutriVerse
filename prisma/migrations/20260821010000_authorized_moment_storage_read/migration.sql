DROP POLICY IF EXISTS "moments_read_authorized" ON storage.objects;
CREATE POLICY "moments_read_authorized"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'moments'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.moments moment
      WHERE moment."imageUrl" = storage.objects.name
        AND NOT moment."isHidden"
        AND (
          moment."privacyLevel" = 'PUBLIC'
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
              WHERE viewer."authUserId" = (SELECT auth.uid()::text)
            )
          )
          OR (
            moment."privacyLevel" = 'COMMUNITY'
            AND EXISTS (
              SELECT 1
              FROM public.users viewer
              JOIN public.guild_members membership ON membership."userId" = viewer."id"
              JOIN public.guilds guild ON guild."id" = membership."guildId"
              WHERE viewer."authUserId" = (SELECT auth.uid()::text)
                AND membership."guildId" = moment."communityId"
                AND membership."status" = 'ACTIVE'
                AND guild."approvalStatus" = 'APPROVED'
                AND guild."isActive"
            )
          )
        )
    )
  )
);
