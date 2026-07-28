-- CreateEnum
CREATE TYPE "LotDisputeRoomStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "LotDisputeMessageKind" AS ENUM ('TEXT', 'SYSTEM');

-- CreateTable
CREATE TABLE "LotDisputeRoom" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "LotDisputeRoomStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotDisputeRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotDisputeMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT,
    "kind" "LotDisputeMessageKind" NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotDisputeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LotDisputeRoom_reportId_key" ON "LotDisputeRoom"("reportId");

-- CreateIndex
CREATE INDEX "LotDisputeRoom_lotId_status_idx" ON "LotDisputeRoom"("lotId", "status");

-- CreateIndex
CREATE INDEX "LotDisputeMessage_roomId_createdAt_idx" ON "LotDisputeMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "LotDisputeMessage_authorId_idx" ON "LotDisputeMessage"("authorId");

-- AddForeignKey
ALTER TABLE "LotDisputeRoom" ADD CONSTRAINT "LotDisputeRoom_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDisputeRoom" ADD CONSTRAINT "LotDisputeRoom_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDisputeMessage" ADD CONSTRAINT "LotDisputeMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LotDisputeRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDisputeMessage" ADD CONSTRAINT "LotDisputeMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOT_DISPUTE_MESSAGE';
