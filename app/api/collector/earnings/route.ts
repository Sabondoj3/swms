import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string; role: string } | undefined;
  if (!me || (me.role !== "COLLECTOR" && me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const collectorId = me.role === "COLLECTOR" ? me.id : undefined;
  const where = collectorId ? { collectorId } : {};
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthWhere = { ...where, confirmedAt: { gte: monthStart } };
  const [summary, payments] = await Promise.all([
    prisma.collectorPayment.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.collectorPayment.findMany({ where, orderBy: { confirmedAt: "desc" }, take: 100, select: { id: true, reportId: true, amount: true, currency: true, status: true, confirmedAt: true, report: { select: { reportNumber: true, address: true } } } }),
  ]);
  const monthly = await prisma.collectorPayment.aggregate({ where: monthWhere, _sum: { amount: true }, _count: { _all: true } });
  return NextResponse.json({ total: summary._sum.amount ?? 0, count: summary._count._all, monthlyTotal: monthly._sum.amount ?? 0, monthlyCount: monthly._count._all, currency: "SLE", payments });
}
