ALTER TABLE "user_connections"
  ADD COLUMN "pairKey" TEXT;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY
        LEAST("requesterId", "addresseeId"),
        GREATEST("requesterId", "addresseeId")
      ORDER BY
        CASE "status"
          WHEN 'BLOCKED' THEN 0
          WHEN 'ACCEPTED' THEN 1
          ELSE 2
        END,
        "createdAt",
        "id"
    ) AS row_number
  FROM "user_connections"
)
DELETE FROM "user_connections"
WHERE "id" IN (
  SELECT "id"
  FROM ranked
  WHERE row_number > 1
);

UPDATE "user_connections"
SET "pairKey" =
  LEAST("requesterId", "addresseeId")
  || ':'
  || GREATEST("requesterId", "addresseeId");

ALTER TABLE "user_connections"
  ALTER COLUMN "pairKey" SET NOT NULL;

CREATE UNIQUE INDEX "user_connections_pairKey_key"
  ON "user_connections"("pairKey");
