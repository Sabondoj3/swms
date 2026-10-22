import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";
const reviewSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("PAID"), receiptUrl: z.string().url().or(z.string().min(1)), note: z.string().trim().max(500).optional() }),
  z.object({ status: z.literal("REJECTED"), rejectionReason: z.string().trim().min(2).max(500) }),
]);

async function currentAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as { id?: string; role?: string } | undefined;
  return user?.id && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") ? user : null;
}

export async function GET() {
  const me = await currentAdmin();
  if (!me) return NextResponse.json({ error: "Only admins can view payment requests" }, { status: 403 });
  try {
    const requests = await prisma.collectorPaymentRequest.findMany({
      orderBy: { createdAt: "desc" }, take: 100,
      include: { collector: { select: { id: true, fullName: true, email: true, phone: true } }, reviewedBy: { select: { fullName: true } } },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("payment request queue failed", error);
    return NextResponse.json({ error: "Payment request storage is not available. Apply the payment-request migration first." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const me = await currentAdmin();
  if (!me) return NextResponse.json({ error: "Only admins can review payment requests" }, { status: 403 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payment review" }, { status: 400 });
  try {
    const existing = await prisma.collectorPaymentRequest.findUnique({ where: { id: params.id }, include: { collector: { select: { id: true, fullName: true } } } });
    if (!existing) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    if (existing.status !== "REQUESTED") return NextResponse.json({ error: `This request is already ${existing.status.toLowerCase()}` }, { status: 409 });
    const updated = await prisma.collectorPaymentRequest.update({ where: { id: existing.id }, data: parsed.data.status === "PAID" ? { status: "PAID", receiptUrl: parsed.data.receiptUrl, reviewedById: me.id, reviewedAt: new Date(), paidAt: new Date(), note: parsed.data.note || existing.note } : { status: "REJECTED", rejectionReason: parsed.data.rejectionReason, reviewedById: me.id, reviewedAt: new Date() } });
    const action = parsed.data.status === "PAID" ? "PAYMENT_REQUEST_PAID" : "PAYMENT_REQUEST_REJECTED";
    await audit({ actorId: me.id, action, entity: "CollectorPaymentRequest", entityId: updated.id, metadata: { amount: updated.amount, currency: updated.currency, receiptUrl: updated.receiptUrl, rejectionReason: updated.rejectionReason } });
    await notifyUser({ userId: existing.collector.id, title: parsed.data.status === "PAID" ? "Payment request paid" : "Payment request rejected", message: parsed.data.status === "PAID" ? `Your SLE${updated.amount} request was paid. The receipt is available in your payment history.` : `Your SLE${updated.amount} payment request was rejected: ${updated.rejectionReason}`, type: "SYSTEM", link: "/collector" });
    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("payment request review failed", error);
    return NextResponse.json({ error: "Could not update payment request" }, { status: 500 });
  }
}
