import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/primitives";
import { TopBar, MobileNav } from "@/components/layout/nav";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const auth = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (!auth) redirect("/login");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [total, open, critical, todayCount, completedToday, collectors, pointsCount, recent] = await Promise.all([
    prisma.wasteReport.count(),
    prisma.wasteReport.count({ where: { status: { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] } } }),
    prisma.wasteReport.count({ where: { priority: "CRITICAL", status: { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] } } }),
    prisma.wasteReport.count({ where: { createdAt: { gte: today } } }),
    prisma.wasteReport.count({ where: { completedAt: { gte: today } } }),
    prisma.user.count({ where: { role: "COLLECTOR", isActive: true } }),
    prisma.collectionPoint.count(),
    prisma.wasteReport.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { reporter: { select: { fullName: true } } } }),
  ]);
  const cards = [["Total reports", total], ["Open", open], ["Critical", critical], ["Today", todayCount], ["Completed today", completedToday], ["Collectors", collectors], ["Points", pointsCount]];
  return (
    <div className="pb-24">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-extrabold">Admin dashboard</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map(([l, v]) => <Card key={l as string} className="text-center"><p className="text-2xl font-extrabold">{v as number}</p><p className="text-xs text-slate-500">{l as string}</p></Card>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[["Reports", "/admin/reports"], ["Points & QR", "/admin/points"], ["Users", "/admin/users"], ["Analytics", "/admin/analytics"], ["Education", "/admin/education"], ["Audit logs", "/admin/audit"], ["Export CSV", "/api/export"], ["Live map", "/points"]].map(([l, h]) => <Link key={l} href={h} className="rounded-2xl border bg-white p-4 font-semibold shadow-sm hover:border-green-300">{l} →</Link>)}
        </div>
        <h2 className="mt-8 font-bold">Recent activity</h2>
        <div className="mt-3 grid gap-2">
          {recent.map((r) => <Link key={r.id} href={`/admin/reports/${r.id}`}><Card className="flex justify-between text-sm"><span className="font-mono font-bold">{r.reportNumber}</span><span className="text-slate-500">{(r.reporter as unknown as { fullName: string }).fullName} • {r.status}</span></Card></Link>)}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
