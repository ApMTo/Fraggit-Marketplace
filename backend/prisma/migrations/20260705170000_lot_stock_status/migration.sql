-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Lot" ADD COLUMN "status" "LotStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "Lot_status_idx" ON "Lot"("status");
