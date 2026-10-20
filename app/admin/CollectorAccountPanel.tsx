"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export default function CollectorAccountPanel() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", temporaryPassword: "" });
  const [issued, setIssued] = useState<{ fullName: string; email: string; temporaryPassword: string } | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setStatus(""); setIssued(null);
    const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) { setError(data?.error ?? "Could not create collector account"); return; }
    setIssued({ fullName: data.user.fullName, email: data.credentials.email, temporaryPassword: data.credentials.temporaryPassword });
    setStatus("Collector account created. Copy these credentials before leaving the dashboard.");
    setForm({ fullName: "", email: "", phone: "", temporaryPassword: "" });
  }

  return (
    <Card className="mt-6 border-green-200 bg-green-50/50">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Create account for a new collector</h2><p className="mt-1 text-sm text-slate-600">Issue login details to newly employed collectors. Collectors cannot register themselves.</p></div><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">Admin only</span></div>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
        <div><Label>Full name</Label><Input required value={form.fullName} onChange={(event) => set("fullName", event.target.value)} placeholder="Collector name" /></div>
        <div><Label>Email address</Label><Input required type="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="collector@example.com" /></div>
        <div><Label>Phone number <span className="font-normal text-slate-400">(optional)</span></Label><Input value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="+263…" /></div>
        <div><Label>Temporary password <span className="font-normal text-slate-400">(optional)</span></Label><Input minLength={8} value={form.temporaryPassword} onChange={(event) => set("temporaryPassword", event.target.value)} placeholder="Generate automatically" /></div>
        <div className="md:col-span-4"><Button disabled={loading}>{loading ? "Creating account…" : "Issue collector login"}</Button></div>
      </form>
      {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {status ? <p className="mt-3 rounded-lg bg-green-100 p-3 text-sm text-green-800">{status}</p> : null}
      {issued ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">Login details for {issued.fullName}</p><p className="mt-1">Email: <span className="font-mono font-bold">{issued.email}</span></p><p>Password: <span className="font-mono font-bold">{issued.temporaryPassword}</span></p><p className="mt-2 text-xs">This password is displayed only once. Share it securely with the collector.</p></div> : null}
    </Card>
  );
}
