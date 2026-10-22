-- Collector withdrawal requests with admin bank-payment receipt tracking.
CREATE TABLE "collector_payment_requests" (
  "id" TEXT NOT NULL,
  "collectorId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'SLE',
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "note" TEXT,
  "receiptUrl" TEXT,
  "reviewedById" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "collector_payment_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "collector_payment_requests_collectorId_status_createdAt_idx" ON "collector_payment_requests"("collectorId", "status", "createdAt");
CREATE INDEX "collector_payment_requests_status_createdAt_idx" ON "collector_payment_requests"("status", "createdAt");
ALTER TABLE "collector_payment_requests" ADD CONSTRAINT "collector_payment_requests_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collector_payment_requests" ADD CONSTRAINT "collector_payment_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
