ALTER TABLE "collector_payment_requests"
  ADD COLUMN "payoutMethod" TEXT NOT NULL DEFAULT 'BANK',
  ADD COLUMN "payoutName" TEXT,
  ADD COLUMN "payoutNumber" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "bankAccountName" TEXT,
  ADD COLUMN "bankAccountNumber" TEXT,
  ADD COLUMN "detailsConfirmed" BOOLEAN NOT NULL DEFAULT false;
