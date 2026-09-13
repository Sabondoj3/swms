"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  actor: {
    fullName: string;
  } | null;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const r = await fetch("/api/audit");
        const d = await r.json();

        if (!r.ok) {
          setErr(d.error ?? "Forbidden");
          return;
        }

        setLogs(d.logs ?? []);
      } catch {
        setErr("Unable to load audit logs.");
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <a
        href="/admin"
        className="mb-4 inline-block text-sm font-semibold text-green-700 hover:underline"
      >
        ← Back to Admin
      </a>

      <h1 className="text-xl font-extrabold">
        Audit logs (Super Admin)
      </h1>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">
          Loading audit logs...
        </p>
      ) : null}

      {err ? (
        <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {err}
        </p>
      ) : null}

      {!loading && !err && logs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No audit logs found.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {logs.map((l) => (
          <Card key={l.id}>
            <p className="text-sm font-bold">
              {l.action} — {l.entity} {l.entityId?.slice(0, 8)}
            </p>

            <p className="text-xs text-slate-500">
              {l.actor?.fullName ?? "system"} •{" "}
              {new Date(l.createdAt).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}