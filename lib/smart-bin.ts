import crypto from "node:crypto";
import { SmartBinConnectivity, SmartBinAlertStatus, Priority } from "@prisma/client";

export function hashDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createDeviceToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function calculateFillPercent(distanceCm: number, emptyDistanceCm: number, fullDistanceCm: number) {
  if (!Number.isFinite(distanceCm) || !Number.isFinite(emptyDistanceCm) || !Number.isFinite(fullDistanceCm)) {
    throw new Error("Distances must be finite numbers");
  }
  if (emptyDistanceCm <= fullDistanceCm) throw new Error("emptyDistanceCm must be greater than fullDistanceCm");
  if (distanceCm < 0 || distanceCm > emptyDistanceCm * 1.5) throw new Error("Distance is outside the calibrated range");
  return Math.max(0, Math.min(100, ((emptyDistanceCm - distanceCm) / (emptyDistanceCm - fullDistanceCm)) * 100));
}

export function getThresholdLevel(fillPercent: number, warningThreshold: number, criticalThreshold: number): Priority {
  if (fillPercent >= criticalThreshold) return Priority.CRITICAL;
  if (fillPercent >= warningThreshold) return Priority.HIGH;
  return Priority.LOW;
}

export function getConnectivity(lastSeenAt: Date | null, sensorOk: boolean, offlineTimeoutMin: number): SmartBinConnectivity {
  if (!sensorOk) return SmartBinConnectivity.SENSOR_ERROR;
  if (!lastSeenAt) return SmartBinConnectivity.NO_DATA;
  const age = Date.now() - lastSeenAt.getTime();
  if (age <= offlineTimeoutMin * 30_000) return SmartBinConnectivity.ONLINE;
  if (age <= offlineTimeoutMin * 60_000) return SmartBinConnectivity.STALE;
  return SmartBinConnectivity.OFFLINE;
}

export function alertMessage(level: Priority, fillPercent: number) {
  return level === Priority.CRITICAL
    ? `Smart bin is critical at ${fillPercent.toFixed(1)}% full`
    : `Smart bin is nearly full at ${fillPercent.toFixed(1)}% full`;
}

export { SmartBinAlertStatus };
