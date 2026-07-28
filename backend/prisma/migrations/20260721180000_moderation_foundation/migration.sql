-- Moderation foundation: lot/review moderation fields, reports, audit, tickets reshape

-- Lot status
ALTER TYPE "LotStatus" ADD VALUE IF NOT EXISTS 'REMOVED';
ALTER TYPE "LotStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

-- User timed suspend
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP(3);

-- Review hide
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "hiddenById" TEXT;

CREATE INDEX IF NOT EXISTS "Review_hiddenAt_idx" ON "Review"("hiddenAt");

DO $$ BEGIN
  ALTER TABLE "Review"
    ADD CONSTRAINT "Review_hiddenById_fkey"
    FOREIGN KEY ("hiddenById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Report enums + table
DO $$ BEGIN
  CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'LOT', 'REVIEW', 'MESSAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'SCAM', 'ABUSE', 'STOLEN', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "targetType" "ReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" "ReportReason" NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "assignedToId" TEXT,
  "resolvedById" TEXT,
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Report_reporterId_targetType_targetId_status_key"
  ON "Report"("reporterId", "targetType", "targetId", "status");
CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_assignedToId_idx" ON "Report"("assignedToId");

DO $$ BEGIN
  ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey"
    FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Moderation audit
DO $$ BEGIN
  CREATE TYPE "ModerationTargetType" AS ENUM ('USER', 'LOT', 'REVIEW', 'REPORT', 'TICKET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModerationActionType" AS ENUM (
    'USER_STATUS_CHANGE',
    'USER_ROLE_CHANGE',
    'USER_SESSIONS_REVOKE',
    'USER_2FA_RESET',
    'LOT_REMOVE',
    'LOT_RESTORE',
    'LOT_UNDER_REVIEW',
    'REVIEW_HIDE',
    'REVIEW_UNHIDE',
    'REPORT_ASSIGN',
    'REPORT_RESOLVE',
    'REPORT_DISMISS',
    'TICKET_CREATE',
    'TICKET_UPDATE',
    'TICKET_RESOLVE',
    'TICKET_MESSAGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ModerationAction" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actionType" "ModerationActionType" NOT NULL,
  "targetType" "ModerationTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ModerationAction_targetType_targetId_createdAt_idx"
  ON "ModerationAction"("targetType", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "ModerationAction_actorId_createdAt_idx"
  ON "ModerationAction"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "ModerationAction_actionType_createdAt_idx"
  ON "ModerationAction"("actionType", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Reshape Ticket enums / columns from legacy support-ticket schema
DO $$ BEGIN
  CREATE TYPE "TicketType_new" AS ENUM ('ORDER_DISPUTE', 'SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketResolution" AS ENUM ('NONE', 'BUYER_FAVOR', 'SELLER_FAVOR', 'NO_ACTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop legacy FKs/indexes that block column renames
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_userId_fkey";
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_assigneeId_fkey";
DROP INDEX IF EXISTS "Ticket_userId_updatedAt_idx";
DROP INDEX IF EXISTS "Ticket_status_updatedAt_idx";
DROP INDEX IF EXISTS "Ticket_assigneeId_updatedAt_idx";
DROP INDEX IF EXISTS "Ticket_type_idx";
DROP INDEX IF EXISTS "Ticket_createdAt_idx";

ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "reporterId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "resolution" "TicketResolution" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "resolutionNote" TEXT;

UPDATE "Ticket" SET "reporterId" = "userId" WHERE "reporterId" IS NULL AND "userId" IS NOT NULL;
UPDATE "Ticket" SET "body" = COALESCE("body", "subject") WHERE "body" IS NULL;

ALTER TABLE "Ticket" ALTER COLUMN "reporterId" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "body" SET NOT NULL;

-- Migrate type enum values
ALTER TABLE "Ticket" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "type" TYPE TEXT USING (
  CASE
    WHEN "type"::text IN ('ORDER_DISPUTE', 'SUPPORT') THEN "type"::text
    ELSE 'SUPPORT'
  END
);
ALTER TABLE "Ticket" ALTER COLUMN "type" TYPE "TicketType_new" USING ("type"::"TicketType_new");

-- Migrate status enum values
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE TEXT USING (
  CASE
    WHEN "status"::text = 'WAITING_FOR_USER' THEN 'WAITING_USER'
    WHEN "status"::text IN ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED') THEN "status"::text
    ELSE 'OPEN'
  END
);
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::"TicketStatus_new");
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"TicketStatus_new";

ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "userId";

DROP TYPE IF EXISTS "TicketType";
DROP TYPE IF EXISTS "TicketStatus";
ALTER TYPE "TicketType_new" RENAME TO "TicketType";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";

CREATE INDEX IF NOT EXISTS "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Ticket_orderId_idx" ON "Ticket"("orderId");
CREATE INDEX IF NOT EXISTS "Ticket_reporterId_createdAt_idx" ON "Ticket"("reporterId", "createdAt");
CREATE INDEX IF NOT EXISTS "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");

DO $$ BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TicketMessage.isInternal
ALTER TABLE "TicketMessage" ADD COLUMN IF NOT EXISTS "isInternal" BOOLEAN NOT NULL DEFAULT false;
