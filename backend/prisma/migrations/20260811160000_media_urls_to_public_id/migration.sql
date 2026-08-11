-- Backfill Cloudinary delivery URLs → public_id (folder/filename).
-- External https URLs (Google, seed CDN, etc.) are left unchanged.

UPDATE "User"
SET "avatarUrl" = regexp_replace(
  "avatarUrl",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "avatarUrl" LIKE 'https://res.cloudinary.com/%';

UPDATE "Category"
SET "iconUrl" = regexp_replace(
  "iconUrl",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "iconUrl" LIKE 'https://res.cloudinary.com/%';

UPDATE "Category"
SET "previewUrl" = regexp_replace(
  "previewUrl",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "previewUrl" LIKE 'https://res.cloudinary.com/%';

UPDATE "Lot"
SET "previewUrl" = regexp_replace(
  "previewUrl",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "previewUrl" LIKE 'https://res.cloudinary.com/%';

UPDATE "LotImage"
SET "url" = regexp_replace(
  "url",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "url" LIKE 'https://res.cloudinary.com/%';

UPDATE "BlogPost"
SET "coverUrl" = regexp_replace(
  "coverUrl",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "coverUrl" LIKE 'https://res.cloudinary.com/%';

UPDATE "MessageAttachment"
SET "url" = regexp_replace(
  "url",
  '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
  ''
)
WHERE "url" LIKE 'https://res.cloudinary.com/%';

UPDATE "LotDisputeMessage"
SET "metadata" = jsonb_set(
  "metadata",
  '{url}',
  to_jsonb(
    regexp_replace(
      "metadata"->>'url',
      '^https://res\.cloudinary\.com/[^/]+/image/upload/(v[0-9]+/)?',
      ''
    )
  )
)
WHERE "metadata" IS NOT NULL
  AND "metadata"->>'url' LIKE 'https://res.cloudinary.com/%';
