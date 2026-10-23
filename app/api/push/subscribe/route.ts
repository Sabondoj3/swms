import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscriptionSchema = z.object({ endpoint: z.string().url().max(2000), keys: z.object({ p256dh: z.string().min(10).max(500), auth: z.string().min(5).max(500) }) });

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user as unknown as { id: string } | undefined;
    if (!me) return NextResponse.json({ error: "Your session has expired. Log in again, then enable phone notifications." }, { status: 401 });
    const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription received from the browser." }, { status: 400 });
    await prisma.pushSubscription.upsert({ where: { endpoint: parsed.data.endpoint }, create: { userId: me.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth }, update: { userId: me.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push subscription save failed", error);
    const code = (error as { code?: string }).code;
    if (code === "P2021") return NextResponse.json({ error: "The push_subscriptions table is missing in the production database. Run the FAMBUL GREEN push-subscriptions SQL migration in Neon, then retry." }, { status: 503 });
    if (code === "P2003") return NextResponse.json({ error: "Your login session refers to a user that is missing from the production database. Log out, log in again, and retry." }, { status: 409 });
    return NextResponse.json({ error: `The server could not save this phone subscription${code ? ` (${code})` : ""}.` }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string } | undefined;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint === "string") await prisma.pushSubscription.deleteMany({ where: { userId: me.id, endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
