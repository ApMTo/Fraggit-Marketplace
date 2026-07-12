-- Convert subcategory name from plain text to localized JSON ({ "en": "..." }).
ALTER TABLE "Subcategory"
ALTER COLUMN "name" TYPE JSONB
USING jsonb_build_object('en', "name");
