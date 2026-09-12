"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/reports/badges";

export default function MyReports() {
  const [filter, setFilter] = useState("ALL");
  const [reports, setReports] = useState<{ id: string; reportNumber: string; address: string; status: string; priority: string; createdAt: string; images: { imageUrl: string }[] }[]>([]);
  useEffect(() => {
    const s = filter === "ALL" ? "" : `?status=${filter}`;
    // API maps ACTIVE/COMPLETED/REJECTED specially; pass through
    fetch(`/api/reports${s}${s ? "&" : "?"}mine=1`).then((r) => r.json()).then((d) => setReports(d.reports ?? [])).catch(() => {});
  }, [filter]);
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
      <h1 className="text-xl font-extrabold">My Reports</h1>
      <div className="mt-3 flex gap-2">
        {["ALL", "ACTIVE", "COMPLETED", "REJECTED"].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === f ? "bg-green-600 text-white" : "bg-white border"}`}>{f}</button>)}
      </div>
      <div className="mt-4 grid gap-3">
        {reports.map((r) => <Link key={r.id} href={`/reports/${r.id}`}><Card className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.images[0]?.imageUrl ?? "/placeholder-waste.jpg"} alt="" className="h-16 w-16 rounded-xl object-cover" />
          <div><p className="text-sm font-bold">{r.reportNumber}</p><p className="text-xs text-slate-500">{r.address} • {new Date(r.createdAt).toLocaleDateString()}</p><div className="mt-1"><StatusBadge status={r.status} /></div></div>
        </Card></Link>)}
        {reports.length === 0 ? <p className="text-sm text-slate-500">No reports.</p> : null}
      </div>
    </main>
  );
}
