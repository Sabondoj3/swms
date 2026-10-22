import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";
const requestSchema = z.object({ amount: z.number().int().positive().max(100000), note: z.string().trim().max(500).optional() });

async function currentCollector() {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as { id?: string; role?: string } | undefined;
  return user?.id && user.role === "COLLECTOR" ? user : null;
}

export async function GET() {
  const me = await currentCollector();
  if (!me) return NextResponse.json({ error: "Only collectors can view payment requests" }, { status: 403 });
  try {
    const [earned, reserved, requests] = await Promise.all([
      prisma.collectorPayment.aggregate({ where: { collectorId: me.id }, _sum: { amount: true } }),
      prisma.collectorPaymentRequest.aggregate({ where: { collectorId: me.id, status: { in: ["REQUESTED", "PAID"] } }, _sum: { amount: true } }),
      prisma.collectorPaymentRequest.findMany({ where: { collectorId: me.id }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, amount: true, currency: true, status: true, note: true, receiptUrl: true, rejectionReason: true, createdAt: true, reviewedAt: true, paidAt: true } }),
    ]);
    const totalEarned = earned._sum.amount ?? 0;
    const reservedAmount = reserved._sum.amount ?? 0;
    return NextResponse.json({ totalEarned, reservedAmount, availableBalance: Math.max(0, totalEarned - reservedAmount), requests });
  } catch (error) {
    console.error("collector payment request lookup failed", error);
    return NextResponse.json({ error: "Payment requests are not available yet. Apply the collector payment-request migration in Neon, then refresh this page." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const me = await currentCollector();
  if (!me) return NextResponse.json({ error: "Only collectors can request payment" }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid amount" }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const earned = await tx.collectorPayment.aggregate({ where: { collectorId: me.id, status: "RECORDED" }, _sum: { amount: true } });
      const reserved = await tx.collectorPaymentRequest.aggregate({ where: { collectorId: me.id, status: { in: ["REQUESTED", "PAID"] } }, _sum: { amount: true } });
      const available = (earned._sum.amount ?? 0) - (reserved._sum.amount ?? 0);
      if (parsed.data.amount > available) throw new Error(`INSUFFICIENT_BALANCE:${Math.max(0, available)}`);
      const created = await tx.collectorPaymentRequest.create({ data: { collectorId: me.id as string, amount: parsed.data.amount, currency: "SLE", note: parsed.data.note || null } });
      return { created, availableAfter: available - parsed.data.amount };
    });
    await audit({ actorId: me.id, action: "PAYMENT_REQUESTED", entity: "CollectorPaymentRequest", entityId: result.created.id, metadata: { amount: result.created.amount, currency: result.created.currency, balanceAfterReservation: result.availableAfter } });
    await notifyAdmins({ title: "Collector payment request", message: `${(me.id as string).slice(0, 8)} requested SLE${result.created.amount}. Review and upload the bank receipt after payment.`, type: "SYSTEM", link: "/admin/payment-requests" });
    return NextResponse.json({ ok: true, request: result.created, availableBalance: result.availableAfter }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("INSUFFICIENT_BALANCE:")) return NextResponse.json({ error: `Requested amount exceeds your available balance of SLE${message.split(":")[1]}.` }, { status: 400 });
    console.error("payment request failed", error);
    return NextResponse.json({ error: "Could not create payment request. Apply the payment-request migration first." }, { status: 503 });
  }
}
