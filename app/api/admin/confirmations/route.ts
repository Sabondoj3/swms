import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const me = session?.user as unknown as { role?: string } | undefined;
    if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Only Admins can view confirmation records" }, { status: 403 });
    }
    const reports = await prisma.wasteReport.findMany({
      where: { status: { in: ["COLLECTED", "COMPLETED"] } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        images: { orderBy: { createdAt: "desc" } },
        reporter: { select: { fullName: true, phone: true } },
        assignments: { orderBy: { assignedAt: "desc" }, take: 1, include: { collector: { select: { id: true, fullName: true, phone: true } } } },
      },
    });
    let payments = new Map<string, { id: string; collectorId: string; amount: number; currency: string; status: string; confirmedAt: Date }>();
    try {
      const saved = await prisma.collectorPayment.findMany({ where: { reportId: { in: reports.map((report) => report.id) } }, select: { id: true, reportId: true, collectorId: true, amount: true, currency: true, status: true, confirmedAt: true } });
      payments = new Map(saved.map((payment) => [payment.reportId, payment]));
    } catch (paymentError) {
      console.error("optional confirmation payment lookup failed", paymentError);
    }
    const pending = reports.filter((report) => report.status === "COLLECTED" || !payments.has(report.id)).map((report) => ({ ...report, collectorPayment: payments.get(report.id) ?? null }));
    return NextResponse.json({ reports: pending });
  } catch (error) {
    console.error("confirmation queue lookup failed", error);
    return NextResponse.json({ error: "Could not load confirmation queue" }, { status: 500 });
  }
}
