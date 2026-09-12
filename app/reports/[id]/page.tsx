import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/primitives";
import { StatusBadge, PriorityBadge, Timeline } from "@/components/reports/badges";
import { TopBar, MobileNav } from "@/components/layout/nav";

export const dynamic = "force-dynamic";

export default async function ReportDetail({ params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (!auth) redirect("/login");
  const report = await prisma.wasteReport.findUnique({ where: { id: params.id }, include: { images: true, collectionPoint: true, history: { orderBy: { createdAt: "asc" } }, assignments: { include: { collector: { select: { fullName: true } } } } } });
  if (!report) return <main className="p-8">Not found</main>;
  if (auth.user.role === "PUBLIC" && report.reporterId !== auth.user.id) redirect("/dashboard");
  return (
    <div className="pb-24">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-mono text-lg font-extrabold">{report.reportNumber}</h1>
        <div className="mt-2 flex gap-2"><StatusBadge status={report.status} /><PriorityBadge priority={report.priority} /></div>
        <div className="mt-4 grid gap-2">
          {report.images.map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={im.id} src={im.imageUrl} alt={im.type} className="w-full rounded-2xl object-cover" />
          ))}
        </div>
        <Card className="mt-4">
          <p className="text-sm"><strong>Location:</strong> {report.address}</p>
          <p className="text-sm"><strong>Category:</strong> {report.wasteCategory} • <strong>Problem:</strong> {report.problemType}</p>
          <p className="mt-2 text-sm text-slate-600">{report.description}</p>
          <p className="mt-2 text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()} • {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
        </Card>
        <h2 className="mt-6 font-bold">Progress</h2>
        <div className="mt-2"><Timeline current={report.status} /></div>
        <h2 className="mt-6 font-bold">History</h2>
        <div className="mt-2 flex flex-col gap-2">
          {report.history.map((h) => <Card key={h.id}><p className="text-xs font-bold">{h.oldStatus ?? "—"} → {h.newStatus}</p><p className="text-xs text-slate-500">{h.comment} • {new Date(h.createdAt).toLocaleString()}</p></Card>)}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
