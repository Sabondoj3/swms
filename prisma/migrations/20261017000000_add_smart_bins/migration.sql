-- Additive migration: preserves existing SWMS data and workflows.
CREATE TYPE "SmartBinConnectivity" AS ENUM ('NO_DATA', 'ONLINE', 'STALE', 'OFFLINE', 'SENSOR_ERROR');
CREATE TYPE "SmartBinAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE "smart_bins" (
  "id" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "locality" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "collectionPointId" TEXT,
  "deviceTokenHash" TEXT NOT NULL,
  "deviceTokenLast4" TEXT NOT NULL,
  "emptyDistanceCm" DOUBLE PRECISION NOT NULL,
  "fullDistanceCm" DOUBLE PRECISION NOT NULL,
  "warningThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
  "criticalThreshold" DOUBLE PRECISION NOT NULL DEFAULT 90,
  "offlineTimeoutMin" INTEGER NOT NULL DEFAULT 30,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "connectivity" "SmartBinConnectivity" NOT NULL DEFAULT 'NO_DATA',
  "lastSeenAt" TIMESTAMP(3),
  "latestDistanceCm" DOUBLE PRECISION,
  "latestFillPercent" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "smart_bins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "smart_bins_deviceId_key" ON "smart_bins"("deviceId");
CREATE INDEX "smart_bins_connectivity_idx" ON "smart_bins"("connectivity");
CREATE INDEX "smart_bins_active_idx" ON "smart_bins"("active");
CREATE INDEX "smart_bins_collectionPointId_idx" ON "smart_bins"("collectionPointId");
ALTER TABLE "smart_bins" ADD CONSTRAINT "smart_bins_collectionPointId_fkey" FOREIGN KEY ("collectionPointId") REFERENCES "collection_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "smart_bin_readings" (
  "id" TEXT NOT NULL,
  "smartBinId" TEXT NOT NULL,
  "deviceReadingId" TEXT NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "distanceCm" DOUBLE PRECISION NOT NULL,
  "fillPercent" DOUBLE PRECISION NOT NULL,
  "sensorOk" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "smart_bin_readings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "smart_bin_readings_smartBinId_deviceReadingId_key" ON "smart_bin_readings"("smartBinId", "deviceReadingId");
CREATE INDEX "smart_bin_readings_smartBinId_measuredAt_idx" ON "smart_bin_readings"("smartBinId", "measuredAt");
ALTER TABLE "smart_bin_readings" ADD CONSTRAINT "smart_bin_readings_smartBinId_fkey" FOREIGN KEY ("smartBinId") REFERENCES "smart_bins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "smart_bin_alerts" (
  "id" TEXT NOT NULL,
  "smartBinId" TEXT NOT NULL,
  "level" "Priority" NOT NULL,
  "status" "SmartBinAlertStatus" NOT NULL DEFAULT 'OPEN',
  "fillPercent" DOUBLE PRECISION NOT NULL,
  "message" TEXT NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "smart_bin_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "smart_bin_alerts_smartBinId_status_idx" ON "smart_bin_alerts"("smartBinId", "status");
CREATE INDEX "smart_bin_alerts_level_status_idx" ON "smart_bin_alerts"("level", "status");
ALTER TABLE "smart_bin_alerts" ADD CONSTRAINT "smart_bin_alerts_smartBinId_fkey" FOREIGN KEY ("smartBinId") REFERENCES "smart_bins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
