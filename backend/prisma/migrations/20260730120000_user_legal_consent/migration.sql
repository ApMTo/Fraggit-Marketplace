-- AlterTable
ALTER TABLE "User" ADD COLUMN "acceptedTermsVersion" TEXT,
ADD COLUMN "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN "acceptedPrivacyVersion" TEXT,
ADD COLUMN "acceptedPrivacyAt" TIMESTAMP(3);
