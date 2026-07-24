-- CreateEnum
CREATE TYPE "LotType" AS ENUM ('ACCOUNT', 'SERVICE');

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN "type" "LotType" NOT NULL DEFAULT 'ACCOUNT';
ALTER TABLE "Lot" ADD COLUMN "serviceQuestion" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "serviceQuestion" TEXT;
ALTER TABLE "Order" ADD COLUMN "buyerAnswer" TEXT;
