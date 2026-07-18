-- Unwrap subcategory names that were double-encoded by the text→jsonb migration
-- when the text column already held a JSON string of { "en", "ru" }.
-- Bad shape:  { "en": "{\"en\":\"Accounts\",\"ru\":\"Аккаунты\"}" }
-- Good shape: { "en": "Accounts", "ru": "Аккаунты" }
UPDATE "Subcategory"
SET "name" = ("name"->>'en')::jsonb
WHERE jsonb_typeof("name") = 'object'
  AND ("name"->>'en') IS NOT NULL
  AND ("name"->>'en') LIKE '{%'
  AND (("name"->>'en')::jsonb) ? 'en';
