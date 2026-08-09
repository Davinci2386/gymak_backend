-- Add the string-array representation without dropping the legacy file table.
-- Keeping the old table for one rollout makes the migration reversible.
ALTER TABLE "TrainerProfile"
ADD COLUMN "certificates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserve existing certificate names in creation order, if any exist.
UPDATE "TrainerProfile" AS profile
SET "certificates" = legacy."certificates"
FROM (
  SELECT
    "profileId",
    array_agg("fileName" ORDER BY "createdAt", "id") AS "certificates"
  FROM "TrainerCertificate"
  GROUP BY "profileId"
) AS legacy
WHERE profile."id" = legacy."profileId";
