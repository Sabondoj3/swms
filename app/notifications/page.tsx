"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, SecondaryButton } from "@/components/ui/primitives";

export default function NotificationsPage() {
  const [items, setItems] = useState<{ id: string; title: string; message: string; read: boolean; createdAt: string; link: string | null }[]>([]);
  async function load() {
    const d = await fetch("/api/notifications").then((r) => r.json()).catch(() => ({ notifications: [] }));
    setItems(d.notifications ?? []);
  }
  useEffect(() => { load(); }, []);
  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    load();
  }
  async function markOne(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="flex items-center justify-between"><h1 className="text-xl font-extrabold">Notifications</h1><SecondaryButton onClick={markAll}>Mark all read</SecondaryButton></div>
      <div className="mt-4 grid gap-2">
        {items.map((n) => <Card key={n.id} className={n.read ? "opacity-70" : "border-green-300"}>
          <p className="text-sm font-bold">{n.title}</p>
          <p className="text-sm text-slate-600">{n.message}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
          <div className="mt-2 flex gap-2">
            {n.link ? <Link href={n.link} className="text-xs font-semibold text-green-700">Open →</Link> : null}
            {!n.read ? <button onClick={() => markOne(n.id)} className="text-xs text-slate-500">Mark read</button> : null}
          </div>
        </Card>)}
        {items.length === 0 ? <p className="text-sm text-slate-500">No notifications.</p> : null}
      </div>
    </main>
  );
}
