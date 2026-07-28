-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "disputePausedFromStatus" "OrderStatus",
ADD COLUMN "autoApproveRemainingMs" INTEGER;
