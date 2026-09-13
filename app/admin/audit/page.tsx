"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";

export default function AuditPage() {
  const [logs, setLogs] = useState<{ id: string; action: string; entity: string; entityId: string; createdAt: string; actor: { fullName: string } | null }[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/audit").then(async (r) => { const d = await r.json(); if (!r.ok) setErr(d.error ?? "Forbidden"); else setLogs(d.logs ?? []); }); }, []);
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <a
        href="/admin"
        className="mb-4 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Admin
      </a>
      <h1 className="text-xl font-extrabold">Audit logs (Super Admin)</h1>
      {err ? <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p> : null}
      <div className="mt-4 grid gap-2">{logs.map((l) => <Card key={l.id}><p className="text-sm font-bold">{l.action} â€” {l.entity} {l.entityId?.slice(0, 8)}</p><p className="text-xs text-slate-500">{l.actor?.fullName ?? "system"} â€¢ {new Date(l.createdAt).toLocaleString()}</p></Card>)}</div>
    </main>
  );
}

