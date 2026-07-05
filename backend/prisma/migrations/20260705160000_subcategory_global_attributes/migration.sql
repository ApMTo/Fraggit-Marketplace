-- CreateTable
CREATE TABLE "SubcategoryGlobalAttribute" (
    "subcategoryId" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,

    CONSTRAINT "SubcategoryGlobalAttribute_pkey" PRIMARY KEY ("subcategoryId", "attributeDefinitionId")
);

-- CreateIndex
CREATE INDEX "SubcategoryGlobalAttribute_attributeDefinitionId_idx" ON "SubcategoryGlobalAttribute"("attributeDefinitionId");

-- AddForeignKey
ALTER TABLE "SubcategoryGlobalAttribute" ADD CONSTRAINT "SubcategoryGlobalAttribute_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcategoryGlobalAttribute" ADD CONSTRAINT "SubcategoryGlobalAttribute_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
