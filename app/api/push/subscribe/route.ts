import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscriptionSchema = z.object({ endpoint: z.string().url().max(2000), keys: z.object({ p256dh: z.string().min(10).max(500), auth: z.string().min(5).max(500) }) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string } | undefined;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  await prisma.pushSubscription.upsert({ where: { endpoint: parsed.data.endpoint }, create: { userId: me.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth }, update: { userId: me.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string } | undefined;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint === "string") await prisma.pushSubscription.deleteMany({ where: { userId: me.id, endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
