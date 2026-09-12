import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user as unknown as { id: string };
  const url = new URL(req.url);
  const unread = url.searchParams.get("unread");
  const notifs = await prisma.notification.findMany({
    where: { userId: me.id, ...(unread === "1" ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: me.id, read: false } });
  return NextResponse.json({ notifications: notifs, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user as unknown as { id: string };
  const body = await req.json().catch(() => ({}));
  if (body.markAll) {
    await prisma.notification.updateMany({ where: { userId: me.id, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await prisma.notification.updateMany({ where: { id: body.id, userId: me.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
