-- Order number sequence for human-readable ids (FR-00001, FR-00002, ...)
CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START WITH 10001;

-- Add orderNumber to existing orders
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

UPDATE "Order"
SET "orderNumber" = 'FR-' || LPAD(nextval('order_number_seq')::text, 5, '0')
WHERE "orderNumber" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- Chat enums and tables
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "pairKey" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "type" "MessageType" NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_pairKey_key" ON "Conversation"("pairKey");
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");
CREATE INDEX "ConversationParticipant_userId_conversationId_idx" ON "ConversationParticipant"("userId", "conversationId");

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_conversationId_createdAt_id_idx" ON "Message"("conversationId", "createdAt", "id");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

CREATE INDEX "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
