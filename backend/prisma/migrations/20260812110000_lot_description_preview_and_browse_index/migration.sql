-- Lot list preview column + browse index
ALTER TABLE "Lot" ADD COLUMN "descriptionPreview" VARCHAR(160);

UPDATE "Lot"
SET "descriptionPreview" = LEFT(TRIM("description"), 160)
WHERE "description" IS NOT NULL AND TRIM("description") <> '';

CREATE INDEX "Lot_subcategoryId_status_createdAt_idx"
ON "Lot"("subcategoryId", "status", "createdAt" DESC);
