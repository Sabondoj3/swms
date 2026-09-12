"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

export default function PointsPage() {
  const [points, setPoints] = useState<{ id: string; code: string; name: string; address: string; latitude: number; longitude: number; status: string }[]>([]);
  useEffect(() => { fetch("/api/points").then((r) => r.json()).then((d) => setPoints(d.points ?? [])).catch(() => {}); }, []);
  const center: [number, number] = points.length ? [points[0].latitude, points[0].longitude] : [-17.824858, 31.053028];
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <h1 className="text-xl font-extrabold">Collection points</h1>
      <div className="mt-4"><LeafletMap points={points.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, label: p.code, sub: p.name }))} center={center} /></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {points.map((p) => <Card key={p.id}><p className="font-mono text-sm font-bold">{p.code}</p><p className="text-sm">{p.name}</p><p className="text-xs text-slate-500">{p.address} • {p.status}</p><Link href={`/report?collectionPoint=${p.code}`} className="mt-2 inline-block text-xs font-semibold text-green-700">Report here →</Link></Card>)}
      </div>
    </main>
  );
}
