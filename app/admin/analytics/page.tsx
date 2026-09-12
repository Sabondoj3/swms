"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

export default function AnalyticsPage() {
  const [data, setData] = useState<{ kpis: Record<string, number>; byStatus: { status: string; _count: number }[]; byCategory: { wasteCategory: string; _count: number }[]; byPriority: { priority: string; _count: number }[]; byMonth: { month: string; count: number }[]; topPoints: { point: string; count: number }[]; topCollectors: { collector: string; count: number }[] } | null>(null);
  useEffect(() => { fetch("/api/analytics").then((r) => r.json()).then(setData).catch(() => {}); }, []);
  if (!data) return <main className="p-8 text-sm">Loading analytics…</main>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-extrabold">Analytics</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(data.kpis).map(([k, v]) => <Card key={k} className="text-center"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-slate-500">{k}</p></Card>)}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card><p className="font-bold">Reports by month</p><div className="h-64"><ResponsiveContainer><BarChart data={data.byMonth}><XAxis dataKey="month" fontSize={10} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><p className="font-bold">By status</p><div className="h-64"><ResponsiveContainer><BarChart data={data.byStatus} layout="vertical"><XAxis type="number" /><YAxis dataKey="status" type="category" width={100} fontSize={10} /><Tooltip /><Bar dataKey="_count" fill="#2563eb" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><p className="font-bold">Waste category</p><div className="h-64"><ResponsiveContainer><PieChart><Pie data={data.byCategory} dataKey="_count" nameKey="wasteCategory" outerRadius={90} label>{data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></Card>
        <Card><p className="font-bold">Top points & collectors</p>
          <p className="mt-2 text-xs font-bold text-slate-500">POINTS</p>
          {data.topPoints.map((t) => <p key={t.point} className="text-sm">{t.point} — <strong>{t.count}</strong></p>)}
          <p className="mt-3 text-xs font-bold text-slate-500">COLLECTORS</p>
          {data.topCollectors.map((t) => <p key={t.collector} className="text-sm">{t.collector} — <strong>{t.count}</strong></p>)}
        </Card>
      </div>
    </main>
  );
}
