"use client";
import { useEffect, useState } from "react";
import { Card, Button, SecondaryButton } from "@/components/ui/primitives";
import { StatusBadge, PriorityBadge, Timeline } from "@/components/reports/badges";

export default function AdminReportDetail({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<{ id: string; reportNumber: string; address: string; status: string; priority: string; wasteCategory: string; problemType: string; description: string; images: { imageUrl: string; type: string }[]; history: { id: string; oldStatus: string; newStatus: string; comment: string; createdAt: string }[] } | null>(null);
  const [collectors, setCollectors] = useState<{ id: string; fullName: string; activeJobs: number }[]>([]);
  const [collectorId, setCollectorId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch(`/api/reports/${params.id}`).then((x) => x.json()).catch(() => null);
    if (r?.report) { setReport(r.report); setStatus(r.report.status); setPriority(r.report.priority); }
    const u = await fetch("/api/users").then((x) => x.json()).catch(() => ({ users: [] }));
    setCollectors((u.users ?? []).filter((x: { role: string }) => x.role === "COLLECTOR"));
  }
  useEffect(() => { load(); }, [params.id]);

  async function saveStatus() {
    const res = await fetch(`/api/reports/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, priority, comment }) });
    const d = await res.json();
    if (!res.ok) setMsg(d.error ?? "Failed");
    else { setMsg(`Updated to ${status}`); load(); }
  }
  async function assign() {
    const res = await fetch(`/api/reports/${params.id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: params.id, collectorId }) });
    const d = await res.json();
    if (!res.ok) setMsg(d.error ?? "Assign failed");
    else { setMsg("Collector assigned"); load(); }
  }

  if (!report) return <main className="p-8 text-sm">Loadingâ€¦</main>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <a
        href="/admin"
        className="mb-4 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Admin
      </a>
      <h1 className="font-mono text-lg font-extrabold">{report.reportNumber}</h1>
      <div className="mt-2 flex gap-2"><StatusBadge status={report.status} /><PriorityBadge priority={report.priority} /></div>
      {msg ? <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm">{msg}</p> : null}
      <div className="mt-3 grid gap-2">{report.images.map((im, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={im.imageUrl} alt={im.type} className="w-full rounded-2xl object-cover" />))}</div>
      <Card className="mt-3 text-sm"><p><strong>{report.address}</strong></p><p>{report.wasteCategory} â€¢ {report.problemType}</p><p className="mt-1 text-slate-600">{report.description}</p></Card>
      <div className="mt-2"><Timeline current={report.status} /></div>
      <Card className="mt-4">
        <p className="font-bold">Verify / update</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">{["SUBMITTED","UNDER_REVIEW","VERIFIED","ASSIGNED","ACCEPTED","ON_THE_WAY","COLLECTED","COMPLETED","REJECTED","CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">{["LOW","MEDIUM","HIGH","CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Internal note / comment" className="rounded-xl border px-3 py-2 text-sm" />
        </div>
        <Button onClick={saveStatus} className="mt-3">Save status</Button>
      </Card>
      <Card className="mt-4">
        <p className="font-bold">Assign collector</p>
        <div className="mt-2 flex flex-col gap-2">
          <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm"><option value="">Select collectorâ€¦</option>{collectors.map((c) => <option key={c.id} value={c.id}>{c.fullName} â€” {c.activeJobs} active</option>)}</select>
          <SecondaryButton onClick={assign} disabled={!collectorId}>Assign</SecondaryButton>
        </div>
      </Card>
      <h2 className="mt-6 font-bold">History</h2>
      <div className="mt-2 grid gap-2">{report.history.map((h) => <Card key={h.id}><p className="text-xs font-bold">{h.oldStatus ?? "â€”"} â†’ {h.newStatus}</p><p className="text-xs text-slate-500">{h.comment}</p></Card>)}</div>
    </main>
  );
}

