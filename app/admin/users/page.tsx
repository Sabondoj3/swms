"use client";
import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export default function AdminUsers() {
  const [users, setUsers] = useState<{ id: string; fullName: string; email: string; role: string; points: number; isActive: boolean; activeJobs: number }[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", temporaryPassword: "" });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ fullName: string; email: string; temporaryPassword: string } | null>(null);
  async function load() {
    const d = await fetch("/api/users").then((r) => r.json()).catch(() => ({ users: [] }));
    setUsers(d.users ?? []);
  }
  useEffect(() => { load(); }, []);
  async function patch(id: string, data: Record<string, unknown>) {
    await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    load();
  }
  async function createCollector(e: React.FormEvent) {
    e.preventDefault(); setCreating(true); setError(""); setMessage(""); setIssued(null);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => null);
    setCreating(false);
    if (!res.ok) { setError(data?.error ?? "Could not create collector account"); return; }
    setIssued({ fullName: data.user.fullName, email: data.credentials.email, temporaryPassword: data.credentials.temporaryPassword });
    setMessage("Collector account created. Copy the credentials before closing this page.");
    setForm({ fullName: "", email: "", phone: "", temporaryPassword: "" });
    load();
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <a
        href="/admin"
        className="mb-4 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Admin
      </a>
      <h1 className="text-xl font-extrabold">Users & collectors</h1>
      <Card className="mt-4 border-green-200 bg-green-50/50">
        <div><p className="text-lg font-bold">Issue a collector account</p><p className="mt-1 text-sm text-slate-600">Collectors do not register themselves. Create their login here and give them the temporary password securely.</p></div>
        <form onSubmit={createCollector} className="mt-4 grid gap-3 md:grid-cols-4">
          <div><Label>Full name</Label><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Collector name" /></div>
          <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="collector@example.com" /></div>
          <div><Label>Phone <span className="font-normal text-slate-400">(optional)</span></Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+263…" /></div>
          <div><Label>Temporary password <span className="font-normal text-slate-400">(optional)</span></Label><Input minLength={8} value={form.temporaryPassword} onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })} placeholder="Generate automatically" /></div>
          <div className="md:col-span-4"><Button disabled={creating}>{creating ? "Creating account…" : "Create collector login"}</Button></div>
        </form>
        {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 rounded-lg bg-green-100 p-3 text-sm text-green-800">{message}</p> : null}
        {issued ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">Credentials for {issued.fullName}</p><p className="mt-1">Email: <span className="font-mono font-bold">{issued.email}</span></p><p>Password: <span className="font-mono font-bold">{issued.temporaryPassword}</span></p><p className="mt-2 text-xs">This password is shown only now. Share it securely with the collector.</p></div> : null}
      </Card>
      <div className="mt-4 grid gap-2">
        {users.map((u) => <Card key={u.id} className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-sm font-bold">{u.fullName} <span className="text-xs font-normal text-slate-500">({u.role}{u.role === "COLLECTOR" ? ` • ${u.activeJobs} active` : ""})</span></p><p className="text-xs text-slate-500">{u.email} • {u.points} pts • {u.isActive ? "active" : "disabled"}</p></div>
          <div className="flex gap-2 text-xs">
            <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })} className="rounded-lg border px-2 py-1">{["PUBLIC","COLLECTOR","ADMIN","SUPER_ADMIN"].map((r) => <option key={r} value={r}>{r}</option>)}</select>
            <button onClick={() => patch(u.id, { isActive: !u.isActive })} className="rounded-lg border px-3 py-1 font-semibold">{u.isActive ? "Disable" : "Enable"}</button>
          </div>
        </Card>)}
      </div>
    </main>
  );
}
