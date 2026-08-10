-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "provider" "AuthProvider",
ADD COLUMN "providerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");
