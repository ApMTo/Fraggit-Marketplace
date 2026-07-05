-- DropIndex
DROP INDEX IF EXISTS "Category_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
