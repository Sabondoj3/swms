import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopBar, MobileNav } from "@/components/layout/nav";
export const dynamic = "force-dynamic";
import { Card } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/reports/badges";

export default async function Dashboard() {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const { user } = auth;
  if (user.role === "COLLECTOR") redirect("/collector");
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") redirect("/admin");

  const [submitted, inProgress, completed, recent, points] = await Promise.all([
    prisma.wasteReport.count({ where: { reporterId: user.id } }),
    prisma.wasteReport.count({ where: { reporterId: user.id, status: { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] } } }),
    prisma.wasteReport.count({ where: { reporterId: user.id, status: "COMPLETED" } }),
    prisma.wasteReport.findMany({ where: { reporterId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { images: true } }),
    prisma.collectionPoint.findMany({ where: { status: "ACTIVE" }, take: 6, orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="pb-24 md:pb-10">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-extrabold">Hello, {user.fullName.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Keep your community clean • {user.points} pts</p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Report Waste", "/report", "bg-green-600 text-white"],
            ["Scan QR", "/scan", "bg-white"],
            ["Nearby Bins", "/points", "bg-white"],
            ["My Reports", "/my-reports", "bg-white"],
          ].map(([label, href, cls]) => (
            <Link key={label} href={href} className={`rounded-2xl p-5 text-center font-semibold shadow-sm border ${cls}`}>{label}</Link>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[["Submitted", submitted], ["In Progress", inProgress], ["Completed", completed]].map(([l, v]) => (
            <Card key={l as string} className="text-center"><p className="text-2xl font-extrabold">{v as number}</p><p className="text-xs text-slate-500">{l as string}</p></Card>
          ))}
        </div>

        <h2 className="mt-8 font-bold">Recent reports</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recent.length === 0 ? <p className="text-sm text-slate-500">No reports yet. <Link href="/report" className="text-green-700 font-semibold">Report waste</Link></p> : recent.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`}><Card className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.images[0]?.imageUrl ?? "/placeholder-waste.jpg"} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div><p className="text-sm font-bold">{r.reportNumber}</p><p className="text-xs text-slate-500">{r.address}</p><div className="mt-1"><StatusBadge status={r.status} /></div></div>
            </Card></Link>
          ))}
        </div>

        <h2 className="mt-8 font-bold">Nearby collection points</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {points.map((p) => (
            <Card key={p.id}><p className="text-sm font-bold">{p.code}</p><p className="text-xs text-slate-500">{p.name} • {p.address}</p><Link href={`/report?collectionPoint=${p.code}`} className="mt-2 inline-block text-xs font-semibold text-green-700">Report here →</Link></Card>
          ))}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
