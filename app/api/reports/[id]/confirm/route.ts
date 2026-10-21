import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { awardPoints, POINTS } from "@/lib/gamification";
import { z } from "zod";

const confirmationSchema = z.object({ comment: z.string().trim().min(2, "Add a confirmation comment").max(1000) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user as unknown as { id: string; role: string } | undefined;
    if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Only Admins can confirm collections" }, { status: 403 });
    const parsed = confirmationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "A confirmation comment is required" }, { status: 400 });

    const report = await prisma.wasteReport.findUnique({ where: { id: params.id }, include: { assignments: { orderBy: { assignedAt: "desc" } } } });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    if (report.status !== "COLLECTED" && report.status !== "COMPLETED") return NextResponse.json({ error: `This report is ${report.status}; only collected reports can be confirmed` }, { status: 409 });
    const assignment = report.assignments.find((item) => item.collectorId);
    if (!assignment) return NextResponse.json({ error: "No collector is assigned to this report" }, { status: 409 });

    const rate = await prisma.collectorRate.findUnique({ where: { wasteCategory: report.wasteCategory } });
    const amount = rate?.amount ?? 50;
    const currency = rate?.currency ?? "SLE";
    const result = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.wasteReport.update({ where: { id: report.id }, data: { status: "COMPLETED", completedAt: report.completedAt ?? new Date() } });
      if (report.status !== "COMPLETED") await tx.reportStatusHistory.create({ data: { reportId: report.id, oldStatus: report.status, newStatus: "COMPLETED", changedById: me.id, comment: parsed.data.comment } });
      await tx.collectorAssignment.update({ where: { id: assignment.id }, data: { status: "COMPLETED", completedAt: new Date(), notes: parsed.data.comment } });
      const payment = await tx.collectorPayment.upsert({
        where: { reportId: report.id },
        create: { reportId: report.id, collectorId: assignment.collectorId, amount, currency, status: "RECORDED", confirmedById: me.id },
        update: { collectorId: assignment.collectorId, amount, currency, status: "RECORDED", confirmedById: me.id, confirmedAt: new Date() },
        select: { id: true, amount: true, currency: true, collectorId: true },
      });
      return { updatedReport, payment, paymentCreated: true };
    });

    if (result.paymentCreated) {
      await notifyUser({ userId: assignment.collectorId, title: "Collection payment recorded", message: `${report.reportNumber} confirmed complete — ${result.payment.currency}${result.payment.amount} recorded. Admin comment: ${parsed.data.comment}`, type: "SYSTEM", reportId: report.id, link: "/collector" });
      await audit({ actorId: me.id, action: "PAYMENT_RECORDED", entity: "CollectorPayment", entityId: report.id, metadata: { collectorId: assignment.collectorId, amount: result.payment.amount, currency: result.payment.currency, wasteCategory: report.wasteCategory } });
      await awardPoints(report.reporterId, POINTS.COMPLETED).catch(() => {});
    }
    await audit({ actorId: me.id, action: "ADMIN_CONFIRMED_COLLECTION", entity: "WasteReport", entityId: report.id, metadata: { collectorId: assignment.collectorId, paymentCreated: result.paymentCreated } });
    return NextResponse.json({ ok: true, report: result.updatedReport, payment: result.payment, paymentCreated: result.paymentCreated, message: `${result.payment.currency}${result.payment.amount} payment assigned to the collector` });
  } catch (error) {
    console.error("collection confirmation failed", error);
    return NextResponse.json({ error: "Could not confirm collection or assign payment" }, { status: 500 });
  }
}
