CREATE TABLE "collector_rates" (
  "id" TEXT NOT NULL,
  "wasteCategory" "WasteCategoryEnum" NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 50,
  "currency" TEXT NOT NULL DEFAULT 'SLE',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collector_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collector_rates_wasteCategory_key" ON "collector_rates"("wasteCategory");

INSERT INTO "collector_rates" ("id", "wasteCategory", "amount", "currency", "updatedAt") VALUES
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000001', 'PLASTIC', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000002', 'PAPER', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000003', 'FOOD_ORGANIC', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000004', 'METAL', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000005', 'GLASS', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000006', 'E_WASTE', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000007', 'MIXED', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000008', 'HAZARDOUS', 50, 'SLE', CURRENT_TIMESTAMP),
  ('b23f0f2d-2b6b-4a4e-8cd7-000000000009', 'OTHER', 50, 'SLE', CURRENT_TIMESTAMP);
