"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";

export default function AdminUsers() {
  const [users, setUsers] = useState<{ id: string; fullName: string; email: string; role: string; points: number; isActive: boolean; activeJobs: number }[]>([]);
  async function load() {
    const d = await fetch("/api/users").then((r) => r.json()).catch(() => ({ users: [] }));
    setUsers(d.users ?? []);
  }
  useEffect(() => { load(); }, []);
  async function patch(id: string, data: Record<string, unknown>) {
    await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    load();
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-extrabold">Users & collectors</h1>
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
