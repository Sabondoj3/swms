-- Record one SLE50 payable entry for each report confirmed complete by an administrator.
CREATE TABLE "collector_payments" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "collectorId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 50,
  "currency" TEXT NOT NULL DEFAULT 'SLE',
  "status" TEXT NOT NULL DEFAULT 'RECORDED',
  "confirmedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collector_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collector_payments_reportId_key" ON "collector_payments"("reportId");
CREATE INDEX "collector_payments_collectorId_createdAt_idx" ON "collector_payments"("collectorId", "createdAt");
CREATE INDEX "collector_payments_status_idx" ON "collector_payments"("status");

ALTER TABLE "collector_payments" ADD CONSTRAINT "collector_payments_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "waste_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collector_payments" ADD CONSTRAINT "collector_payments_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collector_payments" ADD CONSTRAINT "collector_payments_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
