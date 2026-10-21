"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, SecondaryButton } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/reports/badges";
import { MobileNav, TopBar } from "@/components/layout/nav";

type ConfirmationReport = {
  id: string;
  reportNumber: string;
  address: string;
  wasteCategory: string;
  status: string;
  description: string | null;
  updatedAt: string;
  images: { imageUrl: string; type: string }[];
  reporter: { fullName: string; phone: string | null };
  assignments: { collector: { id: string; fullName: string; phone: string | null } }[];
  collectorPayment: { id: string; collectorId: string; amount: number; currency: string; status: string; confirmedAt: string } | null;
};

export default function AdminConfirmationsPage() {
  const [reports, setReports] = useState<ConfirmationReport[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ reportNumber: string; collector: string; amount: number; currency: string } | null>(null);

  async function load() {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/admin/confirmations", { cache: "no-store", signal: controller.signal });
      window.clearTimeout(timeout);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not load confirmation queue");
      setReports(data.reports ?? []);
      setError("");
    } catch (error) {
      setReports([]);
      setError(error instanceof DOMException && error.name === "AbortError" ? "Confirmation queue took too long to load. Check the database connection and try again." : error instanceof Error ? error.message : "Could not load confirmation queue");
    }
  }

  useEffect(() => { load(); }, []);

  async function confirm(report: ConfirmationReport) {
    const comment = comments[report.id]?.trim();
    if (!comment || comment.length < 2) {
      setError("Add a short confirmation comment for this collection first.");
      return;
    }
    setBusy(report.id);
    setError("");
    setMessage("");
    const response = await fetch(`/api/reports/${report.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    const data = await response.json();
    setBusy(null);
    if (!response.ok) {
      setError(data.error ?? "Could not confirm collection");
      return;
    }
    setMessage(`${report.reportNumber} confirmed. The payment record has been saved to the collector account.`);
    setReceipt({
      reportNumber: report.reportNumber,
      collector: report.assignments[0]?.collector.fullName ?? "Assigned collector",
      amount: data.payment?.amount ?? 50,
      currency: data.payment?.currency ?? "SLE",
    });
    await load();
  }

  return (
    <div className="pb-24">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link href="/admin" className="text-sm font-semibold text-green-700 hover:underline">← Back to Admin</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Admin workspace</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Confirmations &amp; payments</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Review collection evidence, approve completed work, and create or repair the collector payment record in one place.</p>
          </div>
          <SecondaryButton onClick={load}>Refresh queue</SecondaryButton>
        </div>
        {message ? <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 grid gap-4">
          {reports.map((report) => {
            const assignment = report.assignments[0];
            const collector = assignment?.collector;
            return (
              <Card key={report.id} className="border-amber-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    {report.images[0] ? <a href={report.images[0].imageUrl} target="_blank" rel="noreferrer"><img src={report.images[0].imageUrl} alt="Collection evidence" className="h-24 w-24 rounded-xl object-cover" /></a> : <div className="grid h-24 w-24 place-items-center rounded-xl bg-slate-100 text-center text-xs text-slate-500">No evidence photo</div>}
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><p className="font-mono font-bold">{report.reportNumber}</p><StatusBadge status={report.status} /></div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{report.address}</p>
                      <p className="mt-1 text-xs text-slate-500">{report.wasteCategory} • Updated {new Date(report.updatedAt).toLocaleString()}</p>
                      <p className="mt-2 text-sm text-slate-600">{report.description || "No collector note was provided."}</p>
                    </div>
                  </div>
                  <Link href={`/admin/reports/${report.id}`} className="text-sm font-semibold text-green-700 hover:underline">Open full report →</Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Collector</p><p className="mt-1 font-semibold">{collector?.fullName ?? "No collector assigned"}</p>{collector?.phone ? <a className="text-sm text-green-700 hover:underline" href={`tel:${collector.phone}`}>{collector.phone}</a> : null}</div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reporter</p><p className="mt-1 font-semibold">{report.reporter.fullName}</p>{report.reporter.phone ? <a className="text-sm text-green-700 hover:underline" href={`tel:${report.reporter.phone}`}>{report.reporter.phone}</a> : null}</div>
                  <div className="rounded-xl bg-green-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-green-800">Payment status</p><p className="mt-1 font-semibold text-green-950">{report.collectorPayment ? `${report.collectorPayment.currency}${report.collectorPayment.amount} recorded` : "Pending admin confirmation"}</p><p className="text-xs text-green-800">One record per confirmed report</p></div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                  <textarea value={comments[report.id] ?? ""} onChange={(event) => setComments({ ...comments, [report.id]: event.target.value })} rows={2} placeholder="Confirmation comment, for example: Evidence reviewed and collection verified." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                  <Button disabled={busy === report.id || !collector} onClick={() => confirm(report)}>{busy === report.id ? "Saving…" : report.collectorPayment ? "Repair payment record" : "Confirm & record payment"}</Button>
                </div>
              </Card>
            );
          })}
          {reports.length === 0 ? <Card className="text-center"><p className="font-semibold text-slate-800">No collections are waiting for confirmation.</p><p className="mt-1 text-sm text-slate-500">When a collector marks a job collected, it will appear here for review.</p></Card> : null}
        </div>
      </main>
      {receipt ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div><h2 className="mt-4 text-2xl font-extrabold">Payment recorded</h2><p className="mt-2 text-sm text-slate-600">{receipt.reportNumber} is confirmed for {receipt.collector}.</p><p className="mt-4 text-4xl font-extrabold text-green-700">{receipt.currency}{receipt.amount}</p><p className="mt-1 text-xs text-slate-500">The amount is now included in the collector dashboard earnings.</p><Button className="mt-6 w-full" onClick={() => setReceipt(null)}>Continue</Button></div></div> : null}
      <MobileNav />
    </div>
  );
}
