"use client";
import { useEffect, useState } from "react";
import { Card, Button, SecondaryButton, Input, Label } from "@/components/ui/primitives";

type Point = { id: string; code: string; name: string; address: string; latitude: number; longitude: number; status: string; qrPayload: string };

export default function AdminPoints() {
  const [points, setPoints] = useState<Point[]>([]);
  const [form, setForm] = useState({ code: "", name: "", address: "", latitude: -17.824858, longitude: 31.053028, binType: "General", capacity: 240 });
  const [qr, setQr] = useState<{ code: string; dataUrl: string; payload: string } | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const d = await fetch("/api/points").then((r) => r.json()).catch(() => ({ points: [] }));
    setPoints(d.points ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setMsg("");
    const res = await fetch("/api/points", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error ?? "Failed"); return; }
    setMsg(`Created ${d.point.code}`);
    setForm({ code: "", name: "", address: "", latitude: -17.824858, longitude: 31.053028, binType: "General", capacity: 240 });
    load();
  }

  async function showQr(id: string) {
    const d = await fetch(`/api/points/${id}`).then((r) => r.json());
    if (d.point) setQr({ code: d.point.code, dataUrl: d.point.qrDataUrl, payload: d.point.qrPayload });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-extrabold">Collection points & QR</h1>
      {msg ? <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm">{msg}</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="font-bold">New point</p>
          <div className="mt-2 grid gap-2">
            <div><Label>Code (e.g. RGU-CAMPUS-BIN-011)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Lat</Label><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} /></div>
              <div><Label>Lng</Label><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} /></div>
            </div>
            <Button onClick={create}>Create + generate QR</Button>
          </div>
        </Card>
        <Card>
          <p className="font-bold">QR preview</p>
          {qr ? <div className="mt-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt={qr.code} className="mx-auto h-56 w-56 rounded-xl border" />
            <p className="mt-2 font-mono text-sm font-bold">{qr.code}</p>
            <p className="break-all text-xs text-slate-500">{qr.payload}</p>
            <div className="mt-2 flex justify-center gap-2">
              <a href={qr.dataUrl} download={`${qr.code}.png`} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">Download</a>
              <SecondaryButton onClick={() => window.print()}>Print</SecondaryButton>
            </div>
          </div> : <p className="mt-2 text-sm text-slate-500">Select “QR” on a point to preview, download and print.</p>}
        </Card>
      </div>
      <div className="mt-4 grid gap-2">
        {points.map((p) => <Card key={p.id} className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono text-sm font-bold">{p.code}</p><p className="text-xs text-slate-500">{p.name} • {p.status}</p></div><div className="flex gap-2"><SecondaryButton onClick={() => showQr(p.id)}>QR</SecondaryButton><a href={`/report?collectionPoint=${p.code}`} className="rounded-xl border px-3 py-2 text-sm font-semibold">Open report link</a></div></Card>)}
      </div>
    </main>
  );
}
