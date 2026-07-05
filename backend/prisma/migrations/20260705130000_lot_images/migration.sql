-- CreateTable
CREATE TABLE "LotImage" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LotImage_lotId_idx" ON "LotImage"("lotId");

-- AddForeignKey
ALTER TABLE "LotImage" ADD CONSTRAINT "LotImage_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
