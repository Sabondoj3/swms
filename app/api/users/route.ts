import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { role: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, fullName: true, email: true, role: true, points: true, isActive: true, createdAt: true } });
  const workload = await prisma.collectorAssignment.groupBy({ by: ["collectorId"], where: { status: { in: ["ASSIGNED", "ACCEPTED", "ON_THE_WAY"] } }, _count: true });
  const map = Object.fromEntries(workload.map((w) => [w.collectorId, w._count]));
  return NextResponse.json({ users: users.map((u) => ({ ...u, activeJobs: map[u.id] ?? 0 })) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string; role: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (body.role && me.role !== "SUPER_ADMIN" && (body.role === "ADMIN" || body.role === "SUPER_ADMIN")) return NextResponse.json({ error: "Only Super Admin can manage admins" }, { status: 403 });
  const updated = await prisma.user.update({ where: { id: body.id }, data: { ...(body.role ? { role: body.role } : {}), ...(body.isActive !== undefined ? { isActive: body.isActive } : {}) } });
  await audit({ actorId: me.id, action: "UPDATE_USER", entity: "User", entityId: body.id, metadata: body });
  return NextResponse.json({ ok: true, user: { id: updated.id } });
}
