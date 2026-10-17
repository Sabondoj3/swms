import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/primitives";
import { MobileNav, TopBar } from "@/components/layout/nav";

export const dynamic = "force-dynamic";

const stateLabel: Record<string, string> = {
  ONLINE: "LIVE / RECENT READING",
  STALE: "STALE READING",
  OFFLINE: "OFFLINE DEVICE",
  SENSOR_ERROR: "SENSOR ERROR",
  NO_DATA: "NO DATA YET",
};

export default async function SmartBinsPage() {
  const auth = await requireUser(["ADMIN", "SUPER_ADMIN"]);
  if (!auth) redirect("/login");
  const bins = await prisma.smartBin.findMany({
    orderBy: { displayName: "asc" },
    include: { collectionPoint: { select: { name: true, code: true } }, alerts: { where: { status: "OPEN" }, orderBy: { openedAt: "desc" }, take: 3 } },
  });
  const counts = bins.reduce<Record<string, number>>((acc, bin) => { acc[bin.connectivity] = (acc[bin.connectivity] ?? 0) + 1; return acc; }, {});
  return (
    <div className="pb-24">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-green-700">Hardware integration</p><h1 className="text-2xl font-extrabold">Smart bins</h1><p className="mt-1 text-sm text-slate-500">Authenticated ESP32 readings only. No simulated readings are shown here.</p></div>
          <a href="/api/smart-bins" className="rounded-xl border px-3 py-2 text-sm font-semibold">View API JSON</a>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {["ONLINE", "STALE", "OFFLINE", "SENSOR_ERROR", "NO_DATA"].map((key) => <Card key={key}><p className="text-2xl font-extrabold">{counts[key] ?? 0}</p><p className="text-xs text-slate-500">{stateLabel[key]}</p></Card>)}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {bins.length === 0 ? <Card><p className="font-semibold">No smart bins registered</p><p className="mt-1 text-sm text-slate-500">An authorized administrator must register a device before it can send readings.</p></Card> : bins.map((bin) => (
            <Card key={bin.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{bin.displayName}</h2><p className="font-mono text-xs text-slate-500">{bin.deviceId}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${bin.connectivity === "ONLINE" ? "bg-green-100 text-green-700" : bin.connectivity === "NO_DATA" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>{stateLabel[bin.connectivity]}</span></div>
              <div className="grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-slate-500">Fill</p><p className="font-bold">{bin.latestFillPercent == null ? "—" : `${bin.latestFillPercent.toFixed(1)}%`}</p></div><div><p className="text-xs text-slate-500">Distance</p><p className="font-bold">{bin.latestDistanceCm == null ? "—" : `${bin.latestDistanceCm.toFixed(1)} cm`}</p></div><div><p className="text-xs text-slate-500">Last seen</p><p className="font-bold">{bin.lastSeenAt ? bin.lastSeenAt.toLocaleString() : "—"}</p></div></div>
              <p className="text-xs text-slate-500">{bin.collectionPoint ? `${bin.collectionPoint.name} (${bin.collectionPoint.code})` : bin.locality ?? "Location not configured"}</p>
              {bin.alerts.length > 0 && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{bin.alerts.map((alert) => <p key={alert.id}>{alert.message}</p>)}</div>}
            </Card>
          ))}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
