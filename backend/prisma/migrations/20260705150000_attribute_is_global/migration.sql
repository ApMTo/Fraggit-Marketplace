-- AlterTable
ALTER TABLE "AttributeDefinition" ADD COLUMN "categoryId" TEXT,
ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;

-- Backfill categoryId from subcategory
UPDATE "AttributeDefinition" ad
SET "categoryId" = s."categoryId"
FROM "Subcategory" s
WHERE ad."subcategoryId" = s."id";

ALTER TABLE "AttributeDefinition" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "AttributeDefinition" ALTER COLUMN "subcategoryId" DROP NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "AttributeDefinition_subcategoryId_key_key";

-- CreateIndex (partial unique: one key per category for global attrs)
CREATE UNIQUE INDEX "AttributeDefinition_global_categoryId_key_key"
ON "AttributeDefinition"("categoryId", "key")
WHERE "isGlobal" = true;

-- CreateIndex (partial unique: one key per subcategory for local attrs)
CREATE UNIQUE INDEX "AttributeDefinition_subcategoryId_key_key"
ON "AttributeDefinition"("subcategoryId", "key")
WHERE "subcategoryId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "AttributeDefinition_categoryId_idx" ON "AttributeDefinition"("categoryId");
CREATE INDEX "AttributeDefinition_categoryId_isGlobal_idx" ON "AttributeDefinition"("categoryId", "isGlobal");

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
