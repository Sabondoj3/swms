import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const collectorSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  temporaryPassword: z.string().min(8).max(72).optional().or(z.literal("")),
});

function getStaff(session: unknown) {
  const me = (session as { user?: unknown } | null)?.user as { id: string; role: string } | undefined;
  return me && (me.role === "ADMIN" || me.role === "SUPER_ADMIN") ? me : null;
}

function generateTemporaryPassword() {
  return `FG-${crypto.randomBytes(6).toString("base64url")}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { role: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { id: true, fullName: true, email: true, role: true, points: true, isActive: true, createdAt: true } });
  const workload = await prisma.collectorAssignment.groupBy({ by: ["collectorId"], where: { status: { in: ["ASSIGNED", "ACCEPTED", "ON_THE_WAY"] } }, _count: true });
  const map = Object.fromEntries(workload.map((w) => [w.collectorId, w._count]));
  return NextResponse.json({ users: users.map((u) => ({ ...u, activeJobs: map[u.id] ?? 0 })) });
}

export async function POST(req: Request) {
  const me = getStaff(await getServerSession(authOptions));
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const parsed = collectorSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid collector details" }, { status: 400 });
    const data = parsed.data;
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    const temporaryPassword = data.temporaryPassword || generateTemporaryPassword();
    const user = await prisma.user.create({
      data: { fullName: data.fullName, email, phone: data.phone || null, passwordHash: await bcrypt.hash(temporaryPassword, 12), role: "COLLECTOR", isActive: true },
      select: { id: true, fullName: true, email: true, role: true },
    });
    await audit({ actorId: me.id, action: "CREATE_COLLECTOR", entity: "User", entityId: user.id, metadata: { email: user.email, role: user.role } });
    return NextResponse.json({ ok: true, user, credentials: { email: user.email, temporaryPassword }, warning: "Show these credentials only to the collector. The password cannot be recovered here." }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create collector account" }, { status: 500 });
  }
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
