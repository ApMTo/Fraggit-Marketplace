-- AlterTable
ALTER TABLE "User" ADD COLUMN "telegramLocale" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
