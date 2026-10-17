import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { createDeviceToken, hashDeviceToken } from "@/lib/smart-bin";

const createSchema = z.object({
  deviceId: z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9._:-]+$/),
  displayName: z.string().trim().min(1).max(120),
  locality: z.string().trim().max(160).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  collectionPointId: z.string().uuid().nullable().optional(),
  emptyDistanceCm: z.number().positive(),
  fullDistanceCm: z.number().nonnegative(),
  warningThreshold: z.number().min(1).max(99).default(70),
  criticalThreshold: z.number().min(2).max(100).default(90),
  offlineTimeoutMin: z.number().int().min(5).max(10080).default(30),
}).refine((v) => v.emptyDistanceCm > v.fullDistanceCm, { message: "Empty distance must be greater than full distance" })
  .refine((v) => v.criticalThreshold > v.warningThreshold, { message: "Critical threshold must exceed warning threshold" });

export async function GET() {
  const auth = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const smartBins = await prisma.smartBin.findMany({
    orderBy: { displayName: "asc" },
    include: { collectionPoint: { select: { id: true, code: true, name: true } }, alerts: { where: { status: "OPEN" }, orderBy: { openedAt: "desc" }, take: 5 } },
  });
  return NextResponse.json({ smartBins });
}

export async function POST(req: Request) {
  const auth = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    const data = parsed.data;
    const token = createDeviceToken();
    const smartBin = await prisma.smartBin.create({
      data: {
        ...data,
        deviceTokenHash: hashDeviceToken(token),
        deviceTokenLast4: token.slice(-4),
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        locality: data.locality || null,
        collectionPointId: data.collectionPointId ?? null,
      },
    });
    await audit({ actorId: auth.user.id, action: "SMART_BIN_REGISTERED", entity: "SmartBin", entityId: smartBin.id, metadata: { deviceId: smartBin.deviceId } });
    return NextResponse.json({ ok: true, smartBin, deviceToken: token, warning: "Save this token now; it will not be shown again." }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "Device ID is already registered" }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: "Failed to register smart bin" }, { status: 500 });
  }
}
