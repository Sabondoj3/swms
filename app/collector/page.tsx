"use client";
import { useEffect, useState } from "react";
import { Card, Button, SecondaryButton } from "@/components/ui/primitives";
import { PriorityBadge, StatusBadge } from "@/components/reports/badges";
import { TopBar, MobileNav } from "@/components/layout/nav";

type Report = { id: string; reportNumber: string; address: string; wasteCategory: string; priority: string; status: string; createdAt: string; images: { imageUrl: string }[] };

export default function CollectorPage() {
  const [jobs, setJobs] = useState<Report[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/reports").then((x) => x.json()).catch(() => ({ reports: [] }));
    setJobs(r.reports ?? []);
  }
  useEffect(() => { load(); }, []);

  async function update(id: string, status: string) {
    setMsg("");
    let completionPhoto: string | undefined;
    const fileInput = document.getElementById(`photo-${id}`) as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (file && (status === "COLLECTED" || status === "COMPLETED")) {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const ud = await up.json();
      if (!up.ok) { setMsg(ud.error ?? "Upload failed"); return; }
      completionPhoto = ud.url;
    }
    const res = await fetch(`/api/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, comment: `Collector: ${status}`, notes: notes[id] ?? "", completionPhoto, wasteAmountKg: (document.getElementById(`kg-${id}`) as HTMLInputElement | null)?.value ? Number((document.getElementById(`kg-${id}`) as HTMLInputElement).value) : undefined }) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error ?? "Update failed"); return; }
    setMsg(`${id.slice(0, 6)} → ${status}`);
    load();
  }

  return (
    <div className="pb-24">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-extrabold">Today&apos;s Jobs ({jobs.length})</h1>
        {msg ? <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">{msg}</p> : null}
        <div className="mt-4 grid gap-3">
          {jobs.map((j) => (
            <Card key={j.id}>
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={j.images[0]?.imageUrl ?? "/placeholder-waste.jpg"} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-mono text-sm font-bold">{j.reportNumber}</p>
                  <p className="text-xs text-slate-500">{j.address} • {j.wasteCategory}</p>
                  <div className="mt-1 flex gap-1"><PriorityBadge priority={j.priority} /><StatusBadge status={j.status} /></div>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <textarea placeholder="Collection notes…" value={notes[j.id] ?? ""} onChange={(e) => setNotes({ ...notes, [j.id]: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" rows={2} />
                <div className="flex flex-wrap gap-2 text-xs">
                  <input id={`kg-${j.id}`} type="number" placeholder="kg" className="w-20 rounded-lg border px-2 py-2" />
                  <input id={`photo-${j.id}`} type="file" accept="image/*" className="text-xs" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => update(j.id, "ACCEPTED")}>Accept</SecondaryButton>
                  <SecondaryButton onClick={() => update(j.id, "ON_THE_WAY")}>On the way</SecondaryButton>
                  <Button onClick={() => update(j.id, "COLLECTED")}>Mark collected</Button>
                  <Button onClick={() => update(j.id, "COMPLETED")} className="bg-emerald-700">Complete</Button>
                  <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(j.address)}`} target="_blank" className="rounded-xl border px-4 py-3 text-sm font-semibold">Navigate</a>
                </div>
              </div>
            </Card>
          ))}
          {jobs.length === 0 ? <p className="text-sm text-slate-500">No jobs assigned.</p> : null}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
