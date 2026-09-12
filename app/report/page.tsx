"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button, SecondaryButton, Card, Input, Label } from "@/components/ui/primitives";
import { WASTE_CATEGORIES, PROBLEM_TYPES } from "@/lib/constants";
import { suggestPriority } from "@/lib/classification";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

type Point = { id: string; code: string; name: string; address: string; latitude: number; longitude: number };

function WizardInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [points, setPoints] = useState<Point[]>([]);
  const [collectionPointId, setCollectionPointId] = useState("");
  const [lat, setLat] = useState(-17.824858);
  const [lng, setLng] = useState(31.053028);
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [wasteCategory, setWasteCategory] = useState("MIXED");
  const [problemType, setProblemType] = useState("BIN_OVERFLOWING");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    fetch("/api/points").then((r) => r.json()).then((d) => {
      setPoints(d.points ?? []);
      const code = params.get("collectionPoint");
      if (code) {
        const found = (d.points ?? []).find((p: Point) => p.code === code);
        if (found) { setCollectionPointId(found.id); setLat(found.latitude); setLng(found.longitude); setAddress(found.address); }
      }
    }).catch(() => {});
  }, [params]);

  function useLocation() {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition((pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); }, () => setError("Location permission denied"));
  }

  function onFile(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    setError(""); setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const ud = await up.json();
        if (!up.ok) throw new Error(ud.error ?? "Upload failed");
        imageUrls = [ud.url];
      }
      const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collectionPointId: collectionPointId || null, latitude: lat, longitude: lng, address, wasteCategory, problemType, description, imageUrls }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setDone(data.report.reportNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setSubmitting(false); }
  }

  if (done) return <main className="mx-auto max-w-md px-4 py-10 text-center"><Card><p className="text-4xl">✅</p><h1 className="mt-2 text-xl font-extrabold">Report submitted</h1><p className="mt-1 font-mono font-bold text-green-700">{done}</p><p className="mt-2 text-sm text-slate-500">Admin will verify and assign a collector. Track progress in My Reports.</p><div className="mt-4 flex gap-2 justify-center"><Button onClick={() => router.push(`/my-reports`)}>My Reports</Button><SecondaryButton onClick={() => router.push("/dashboard")}>Home</SecondaryButton></div></Card></main>;

  const suggested = suggestPriority(problemType, wasteCategory);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <h1 className="text-xl font-extrabold">Report Waste — Step {step} of 4</h1>
      <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-green-600" style={{ width: `${step * 25}%` }} /></div>
      {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {step === 1 ? (
        <Card className="mt-4 flex flex-col gap-3">
          <div><Label>Collection point (optional)</Label>
            <select value={collectionPointId} onChange={(e) => { setCollectionPointId(e.target.value); const p = points.find((x) => x.id === e.target.value); if (p) { setLat(p.latitude); setLng(p.longitude); setAddress(p.address); } }} className="w-full rounded-xl border px-4 py-3 text-sm">
              <option value="">Custom location</option>
              {points.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </div>
          <div><Label>Address / description</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Behind Library, near gate" /></div>
          <div className="flex gap-2"><SecondaryButton onClick={useLocation} type="button">Use my location</SecondaryButton><span className="text-xs text-slate-500 self-center">or tap map</span></div>
          <LeafletMap points={points.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, label: p.code }))} center={[lat, lng]} onPick={(a, b) => { setLat(a); setLng(b); }} pickMarker={{ lat, lng }} />
          <p className="text-xs text-slate-500">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
          <Button disabled={!address} onClick={() => setStep(2)}>Continue</Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-4 flex flex-col gap-3">
          <Label>Photo (camera or gallery)</Label>
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="text-sm" />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="max-h-72 rounded-xl object-cover" />
          ) : <p className="text-sm text-slate-500">Photo helps collectors. You can submit without one, but it is recommended.</p>}
          <div className="flex gap-2"><SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton><Button onClick={() => setStep(3)}>Continue</Button></div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="mt-4 flex flex-col gap-3">
          <div><Label>Waste type</Label><div className="grid grid-cols-3 gap-2">{WASTE_CATEGORIES.map((c) => <button key={c.value} onClick={() => setWasteCategory(c.value)} className={`rounded-xl border p-3 text-xs font-semibold ${wasteCategory === c.value ? "border-green-600 bg-green-50 text-green-800" : "bg-white"}`}>{c.label}</button>)}</div></div>
          <div><Label>Problem type</Label><div className="grid grid-cols-2 gap-2">{PROBLEM_TYPES.map((c) => <button key={c.value} onClick={() => setProblemType(c.value)} className={`rounded-xl border p-3 text-xs font-semibold ${problemType === c.value ? "border-green-600 bg-green-50 text-green-800" : "bg-white"}`}>{c.label}</button>)}</div></div>
          <p className="text-xs text-slate-500">Suggested priority: <strong>{suggested}</strong> (admin can override)</p>
          <div className="flex gap-2"><SecondaryButton onClick={() => setStep(2)}>Back</SecondaryButton><Button onClick={() => setStep(4)}>Continue</Button></div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="mt-4 flex flex-col gap-3">
          <div><Label>Additional description</Label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-xl border px-4 py-3 text-sm" placeholder="Any helpful detail…" /></div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs">Location: {address} ({lat.toFixed(4)}, {lng.toFixed(4)}) • {wasteCategory} • {problemType}</div>
          <div className="flex gap-2"><SecondaryButton onClick={() => setStep(3)}>Back</SecondaryButton><Button disabled={submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit report"}</Button></div>
        </Card>
      ) : null}
    </main>
  );
}

export default function ReportWizard() {
  return (
    <Suspense fallback={<main className="p-8 text-sm">Loading…</main>}>
      <WizardInner />
    </Suspense>
  );
}
