import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Priority, SmartBinAlertStatus } from "@prisma/client";
import { alertMessage, calculateFillPercent, getConnectivity, getThresholdLevel, hashDeviceToken } from "@/lib/smart-bin";

const readingSchema = z.object({
  deviceId: z.string().trim().min(3).max(100),
  readingId: z.string().trim().min(1).max(120),
  measuredAt: z.string().datetime({ offset: true }),
  distanceCm: z.number().finite().min(0).max(1000),
  fillPercent: z.number().finite().min(0).max(100).optional(),
  sensorOk: z.boolean().default(true),
});

export async function POST(req: Request) {
  const deviceId = req.headers.get("x-device-id") ?? "";
  const deviceToken = req.headers.get("x-device-token") ?? "";
  if (!deviceId || !deviceToken) return NextResponse.json({ error: "Missing device credentials" }, { status: 401 });
  try {
    const parsed = readingSchema.safeParse({ ...(await req.json()), deviceId });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reading" }, { status: 400 });
    const data = parsed.data;
    const smartBin = await prisma.smartBin.findUnique({ where: { deviceId } });
    if (!smartBin || !smartBin.active || !cryptoSafeEqual(smartBin.deviceTokenHash, hashDeviceToken(deviceToken))) {
      return NextResponse.json({ error: "Invalid device credentials" }, { status: 401 });
    }
    const measuredAt = new Date(data.measuredAt);
    if (measuredAt.getTime() > Date.now() + 5 * 60_000 || measuredAt.getTime() < Date.now() - 7 * 24 * 60 * 60_000) {
      return NextResponse.json({ error: "Timestamp is outside the accepted window" }, { status: 400 });
    }
    const fillPercent = data.sensorOk ? calculateFillPercent(data.distanceCm, smartBin.emptyDistanceCm, smartBin.fullDistanceCm) : null;
    if (data.sensorOk && data.fillPercent !== undefined && Math.abs(data.fillPercent - (fillPercent ?? 0)) > 5) {
      return NextResponse.json({ error: "Reported fill percentage does not match calibrated distance" }, { status: 422 });
    }
    const existing = await prisma.smartBinReading.findUnique({ where: { smartBinId_deviceReadingId: { smartBinId: smartBin.id, deviceReadingId: data.readingId } } });
    if (existing) return NextResponse.json({ ok: true, duplicate: true, receivedAt: existing.receivedAt });
    const now = new Date();
    const level = data.sensorOk && fillPercent !== null ? getThresholdLevel(fillPercent, smartBin.warningThreshold, smartBin.criticalThreshold) : Priority.LOW;
    await prisma.$transaction(async (tx) => {
      await tx.smartBinReading.create({ data: { smartBinId: smartBin.id, deviceReadingId: data.readingId, measuredAt, distanceCm: data.distanceCm, fillPercent: fillPercent ?? 0, sensorOk: data.sensorOk } });
      await tx.smartBin.update({ where: { id: smartBin.id }, data: { lastSeenAt: now, latestDistanceCm: data.distanceCm, latestFillPercent: fillPercent, connectivity: getConnectivity(now, data.sensorOk, smartBin.offlineTimeoutMin) } });
      if (data.sensorOk && fillPercent !== null && (level === Priority.HIGH || level === Priority.CRITICAL)) {
        const active = await tx.smartBinAlert.findFirst({ where: { smartBinId: smartBin.id, level, status: { in: [SmartBinAlertStatus.OPEN, SmartBinAlertStatus.ACKNOWLEDGED] } } });
        if (!active) await tx.smartBinAlert.create({ data: { smartBinId: smartBin.id, level, fillPercent, message: alertMessage(level, fillPercent) } });
      } else if (level === Priority.LOW) {
        await tx.smartBinAlert.updateMany({ where: { smartBinId: smartBin.id, status: SmartBinAlertStatus.OPEN }, data: { status: SmartBinAlertStatus.RESOLVED, resolvedAt: now } });
      }
    });
    return NextResponse.json({ ok: true, deviceId, receivedAt: now.toISOString(), fillPercent, connectivity: getConnectivity(now, data.sensorOk, smartBin.offlineTimeoutMin) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process reading" }, { status: 500 });
  }
}

function cryptoSafeEqual(a: string, b: string) {
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
