-- Convert plain-string title/content into localized JSON (copy into en + ru).
ALTER TABLE "BlogPost"
  ALTER COLUMN "title" SET DATA TYPE JSONB USING json_build_object('en', "title", 'ru', "title"),
  ALTER COLUMN "content" SET DATA TYPE JSONB USING json_build_object('en', "content", 'ru', "content");
