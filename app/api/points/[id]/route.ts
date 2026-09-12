import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildQrPayload, generateQrDataUrl } from "@/lib/qr";
import { audit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const point = await prisma.collectionPoint.findUnique({ where: { id: params.id }, include: { organization: true, reports: { take: 5, orderBy: { createdAt: "desc" } } } });
  if (!point) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const qrDataUrl = await generateQrDataUrl(point.qrPayload);
  return NextResponse.json({ point: { ...point, qrDataUrl } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string; role: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  if (body.regenerateQr) {
    const existing = await prisma.collectionPoint.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.collectionPoint.update({ where: { id: params.id }, data: { qrPayload: buildQrPayload(existing.code) + `&v=${Date.now()}` } });
    await audit({ actorId: me.id, action: "REGENERATE_QR", entity: "CollectionPoint", entityId: params.id });
    return NextResponse.json({ ok: true, point: updated });
  }
  const allowed = ["name", "address", "latitude", "longitude", "capacity", "binType", "status", "collectionFrequency", "wasteCategory"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (body[k] !== undefined) data[k] = body[k];
  const updated = await prisma.collectionPoint.update({ where: { id: params.id }, data: data as never });
  await audit({ actorId: me.id, action: "UPDATE_POINT", entity: "CollectionPoint", entityId: params.id });
  return NextResponse.json({ ok: true, point: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string; role: string } | undefined;
  if (!me || me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Only Super Admin can delete" }, { status: 403 });
  await prisma.collectionPoint.delete({ where: { id: params.id } });
  await audit({ actorId: me.id, action: "DELETE_POINT", entity: "CollectionPoint", entityId: params.id });
  return NextResponse.json({ ok: true });
}
