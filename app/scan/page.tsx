"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui/primitives";

export default function ScanPage() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const [points, setPoints] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => { fetch("/api/points").then((r) => r.json()).then((d) => setPoints(d.points ?? [])).catch(() => {}); }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-xl font-extrabold">Scan QR</h1>
      <p className="text-sm text-slate-500">Point your camera at a bin QR, or enter the code manually. QR opens <code>/report?collectionPoint=CODE</code>.</p>
      <Card className="mt-4 flex flex-col gap-3">
        <label className="text-sm font-medium">Bin code (e.g. RGU-CAMPUS-BIN-001)</label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="rounded-xl border px-4 py-3 font-mono text-sm" placeholder="RGU-CAMPUS-BIN-001" list="codes" />
        <datalist id="codes">{points.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</datalist>
        <Button disabled={!code} onClick={() => router.push(`/report?collectionPoint=${encodeURIComponent(code)}`)}>Continue to report</Button>
        <p className="text-xs text-slate-400">Tip: phone cameras can scan the printed QR directly — it links to the same report URL.</p>
      </Card>
    </main>
  );
}
