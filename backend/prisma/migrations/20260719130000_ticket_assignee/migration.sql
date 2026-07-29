-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_updatedAt_idx" ON "Ticket"("assigneeId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
