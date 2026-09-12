import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { id: string; role: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [total, byStatus, byCategory, byPriority, recent, collectors] = await Promise.all([
    prisma.wasteReport.count(),
    prisma.wasteReport.groupBy({ by: ["status"], _count: true }),
    prisma.wasteReport.groupBy({ by: ["wasteCategory"], _count: true }),
    prisma.wasteReport.groupBy({ by: ["priority"], _count: true }),
    prisma.wasteReport.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { reporter: { select: { fullName: true } } } }),
    prisma.collectorAssignment.groupBy({ by: ["collectorId"], _count: true, _max: { completedAt: true } }),
  ]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayCount, completedToday, critical, open, activeCollectors, pointsCount] = await Promise.all([
    prisma.wasteReport.count({ where: { createdAt: { gte: today } } }),
    prisma.wasteReport.count({ where: { completedAt: { gte: today } } }),
    prisma.wasteReport.count({ where: { priority: "CRITICAL", status: { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] } } }),
    prisma.wasteReport.count({ where: { status: { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] } } }),
    prisma.user.count({ where: { role: "COLLECTOR", isActive: true } }),
    prisma.collectionPoint.count(),
  ]);

  const byMonthRaw: { month: string; count: bigint }[] = await prisma.$queryRaw`SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count FROM "waste_reports" GROUP BY 1 ORDER BY 1 DESC LIMIT 12`;
  const topPoints = await prisma.wasteReport.groupBy({ by: ["collectionPointId"], _count: true, orderBy: { _count: { collectionPointId: "desc" } }, take: 5 });

  let collectorNames: Record<string, string> = {};
  if (collectors.length) {
    const users = await prisma.user.findMany({ where: { id: { in: collectors.map((c) => c.collectorId) } }, select: { id: true, fullName: true } });
    collectorNames = Object.fromEntries(users.map((u) => [u.id, u.fullName]));
  }
  let pointNames: Record<string, string> = {};
  const ids = topPoints.map((t) => t.collectionPointId).filter(Boolean) as string[];
  if (ids.length) {
    const pts = await prisma.collectionPoint.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, code: true } });
    pointNames = Object.fromEntries(pts.map((p) => [p.id, `${p.code} — ${p.name}`]));
  }

  const completed = await prisma.wasteReport.count({ where: { status: "COMPLETED" } });
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    kpis: { total, open, critical, today: todayCount, completedToday, activeCollectors, points: pointsCount, completionRate },
    byStatus, byCategory, byPriority, byMonth: byMonthRaw.reverse(),
    topPoints: topPoints.map((t) => ({ point: t.collectionPointId ? pointNames[t.collectionPointId] ?? t.collectionPointId : "Custom location", count: t._count })),
    topCollectors: collectors.map((c) => ({ collector: collectorNames[c.collectorId] ?? c.collectorId, count: c._count })).sort((a, b) => b.count - a.count).slice(0, 5),
    recent,
  });
}
