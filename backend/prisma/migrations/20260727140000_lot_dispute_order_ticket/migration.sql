-- AlterTable
ALTER TABLE "LotDisputeRoom" ALTER COLUMN "reportId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LotDisputeRoom" ADD COLUMN "orderId" TEXT,
ADD COLUMN "ticketId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LotDisputeRoom_ticketId_key" ON "LotDisputeRoom"("ticketId");

-- CreateIndex
CREATE INDEX "LotDisputeRoom_orderId_status_idx" ON "LotDisputeRoom"("orderId", "status");

-- AddForeignKey
ALTER TABLE "LotDisputeRoom" ADD CONSTRAINT "LotDisputeRoom_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDisputeRoom" ADD CONSTRAINT "LotDisputeRoom_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
