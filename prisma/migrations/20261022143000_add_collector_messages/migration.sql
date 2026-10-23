CREATE TABLE "collector_messages" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "recipientId" TEXT,
  "audience" TEXT NOT NULL DEFAULT 'COLLECTORS',
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collector_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "collector_messages_recipientId_createdAt_idx" ON "collector_messages"("recipientId", "createdAt");
CREATE INDEX "collector_messages_audience_createdAt_idx" ON "collector_messages"("audience", "createdAt");
CREATE INDEX "collector_messages_senderId_createdAt_idx" ON "collector_messages"("senderId", "createdAt");
ALTER TABLE "collector_messages" ADD CONSTRAINT "collector_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collector_messages" ADD CONSTRAINT "collector_messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
