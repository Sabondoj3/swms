import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collectionPointSchema } from "@/lib/validations";
import { buildQrPayload } from "@/lib/qr";
import { audit } from "@/lib/audit";

export async function GET() {
  const points = await prisma.collectionPoint.findMany({ include: { organization: true }, orderBy: { code: "asc" } });
  return NextResponse.json({ points });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user as unknown as { id: string; role: string } | undefined;
    if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const parsed = collectionPointSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const d = parsed.data;
    const exists = await prisma.collectionPoint.findUnique({ where: { code: d.code.toUpperCase() } });
    if (exists) return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    const code = d.code.toUpperCase();
    const point = await prisma.collectionPoint.create({
      data: { code, name: d.name, organizationId: d.organizationId || null, address: d.address, latitude: d.latitude, longitude: d.longitude, capacity: d.capacity, binType: d.binType, wasteCategory: d.wasteCategory as never, collectionFrequency: d.collectionFrequency, status: d.status as never, qrPayload: buildQrPayload(code) },
    });
    await audit({ actorId: me.id, action: "CREATE_POINT", entity: "CollectionPoint", entityId: point.id });
    return NextResponse.json({ ok: true, point });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create point" }, { status: 500 });
  }
}
