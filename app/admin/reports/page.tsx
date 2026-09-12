"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { StatusBadge, PriorityBadge } from "@/components/reports/badges";

export default function AdminReports() {
  const [reports, setReports] = useState<{ id: string; reportNumber: string; address: string; status: string; priority: string; wasteCategory: string; createdAt: string; reporter: { fullName: string } }[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  useEffect(() => {
    fetch(`/api/reports${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.json()).then((d) => {
      let list = d.reports ?? [];
      if (status !== "ALL") list = list.filter((x: { status: string }) => x.status === status);
      setReports(list);
    }).catch(() => {});
  }, [q, status]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between"><h1 className="text-xl font-extrabold">Reports</h1><a href="/api/export" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">Export CSV</a></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, location…" className="rounded-xl border px-4 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          {["ALL","SUBMITTED","UNDER_REVIEW","VERIFIED","ASSIGNED","ACCEPTED","ON_THE_WAY","COLLECTED","COMPLETED","REJECTED","CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead><tr className="bg-slate-50 text-left text-xs text-slate-500"><th className="p-3">Report</th><th className="p-3">User</th><th className="p-3">Location</th><th className="p-3">Category</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
          <tbody>
            {reports.map((r) => <tr key={r.id} className="border-t hover:bg-slate-50"><td className="p-3 font-mono font-bold"><Link href={`/admin/reports/${r.id}`} className="text-green-700">{r.reportNumber}</Link></td><td className="p-3">{r.reporter?.fullName}</td><td className="p-3">{r.address}</td><td className="p-3">{r.wasteCategory}</td><td className="p-3"><PriorityBadge priority={r.priority} /></td><td className="p-3"><StatusBadge status={r.status} /></td><td className="p-3 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td></tr>)}
          </tbody>
        </table>
      </div>
      {reports.length === 0 ? <Card className="mt-3 text-sm text-slate-500">No reports found.</Card> : null}
    </main>
  );
}
