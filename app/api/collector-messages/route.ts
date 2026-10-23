import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";
const messageSchema = z.object({ body: z.string().trim().min(1, "Write a message first").max(2000), recipientId: z.string().optional() });

async function identity() {
  const session = await getServerSession(authOptions);
  return session?.user as unknown as { id?: string; role?: string; name?: string } | undefined;
}

export async function GET() {
  const me = await identity();
  if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN" && me.role !== "COLLECTOR") return NextResponse.json({ error: "Only Admins and collectors can use this channel" }, { status: 403 });
  try {
    const where = me.role === "COLLECTOR" ? { OR: [{ audience: "COLLECTORS" }, { recipientId: me.id }, { senderId: me.id }] } : {};
    const messages = await prisma.collectorMessage.findMany({ where, orderBy: { createdAt: "asc" }, take: 200, include: { sender: { select: { id: true, fullName: true, role: true } }, recipient: { select: { id: true, fullName: true, role: true } } } });
    const collectors = me.role === "COLLECTOR" ? [] : await prisma.user.findMany({ where: { role: "COLLECTOR", isActive: true }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, email: true } });
    return NextResponse.json({ messages, collectors, role: me.role });
  } catch (error) {
    console.error("collector messages lookup failed", error);
    return NextResponse.json({ error: "Messaging storage is not available. Apply the collector-messages migration first." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const me = await identity();
  if (!me?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN" && me.role !== "COLLECTOR") return NextResponse.json({ error: "Only Admins and collectors can send messages" }, { status: 403 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 });
  try {
    if (me.role === "COLLECTOR") {
      const admin = parsed.data.recipientId ? await prisma.user.findFirst({ where: { id: parsed.data.recipientId, role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true }, select: { id: true } }) : await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true }, orderBy: { createdAt: "asc" }, select: { id: true } });
      if (!admin) return NextResponse.json({ error: "No active Admin is available to receive replies" }, { status: 409 });
      const message = await prisma.collectorMessage.create({ data: { senderId: me.id, recipientId: admin.id, audience: "ADMIN", body: parsed.data.body } });
      await audit({ actorId: me.id, action: "COLLECTOR_MESSAGE_SENT", entity: "CollectorMessage", entityId: message.id, metadata: { recipientId: admin.id } });
      await notifyUser({ userId: admin.id, title: "Message from a collector", message: parsed.data.body.slice(0, 160), type: "SYSTEM", link: "/admin/collector-messages" });
      return NextResponse.json({ ok: true, message }, { status: 201 });
    }
    const directCollector = parsed.data.recipientId ? await prisma.user.findFirst({ where: { id: parsed.data.recipientId, role: "COLLECTOR", isActive: true }, select: { id: true } }) : null;
    if (parsed.data.recipientId && !directCollector) return NextResponse.json({ error: "That collector is not active" }, { status: 404 });
    const message = await prisma.collectorMessage.create({ data: { senderId: me.id, recipientId: directCollector?.id, audience: directCollector ? "COLLECTOR" : "COLLECTORS", body: parsed.data.body } });
    const collectors = directCollector ? [directCollector] : await prisma.user.findMany({ where: { role: "COLLECTOR", isActive: true }, select: { id: true } });
    await audit({ actorId: me.id, action: directCollector ? "COLLECTOR_DIRECT_MESSAGE_SENT" : "COLLECTOR_BROADCAST_SENT", entity: "CollectorMessage", entityId: message.id, metadata: { recipientCount: collectors.length, recipientId: directCollector?.id } });
    await Promise.all(collectors.map((collector) => notifyUser({ userId: collector.id, title: directCollector ? "New Admin message" : "New Admin update", message: parsed.data.body.slice(0, 160), type: "SYSTEM", link: "/collector-messages" })));
    return NextResponse.json({ ok: true, message, recipientCount: collectors.length }, { status: 201 });
  } catch (error) {
    console.error("collector message send failed", error);
    return NextResponse.json({ error: "Could not send this message. Apply the collector-messages migration first." }, { status: 503 });
  }
}
