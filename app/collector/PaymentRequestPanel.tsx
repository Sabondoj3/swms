"use client";
import { useEffect, useState } from "react";
import { Button, Card, Input, SecondaryButton } from "@/components/ui/primitives";

type PaymentRequest = { id: string; amount: number; currency: string; status: string; note: string | null; receiptUrl: string | null; rejectionReason: string | null; createdAt: string; paidAt: string | null };
export default function PaymentRequestPanel() {
  const [available, setAvailable] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [reserved, setReserved] = useState(0);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/collector/payment-requests", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setAvailable(data.availableBalance ?? 0); setTotalEarned(data.totalEarned ?? 0); setReserved(data.reservedAmount ?? 0); setRequests(data.requests ?? []); }
    else setMessage(data.error ?? "Unable to load payment requests.");
  }
  useEffect(() => { load(); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const response = await fetch("/api/collector/payment-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amount), note }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Could not submit request"); return; }
    setAmount(""); setNote(""); setMessage("Payment request submitted. The amount is reserved until Admin pays or rejects it."); await load();
  }
  return <Card className="mt-4 border-blue-200 bg-blue-50">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-blue-950">Request a payment</h2><p className="mt-1 text-sm text-blue-800">Request any amount from confirmed earnings. Pending requests are reserved so your balance stays accurate.</p></div><div className="rounded-xl bg-white px-4 py-3 text-right"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Available balance</p><p className="text-2xl font-extrabold text-blue-950">SLE{available}</p></div></div>
    <p className="mt-2 text-xs text-blue-800">Earned SLE{totalEarned} • Reserved SLE{reserved}</p>
    <form onSubmit={submit} className="mt-4 grid gap-2 md:grid-cols-[140px_1fr_auto]"><Input type="number" min="1" max={available || undefined} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" required /><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note for Admin" maxLength={500} /><Button disabled={busy || available < 1}>{busy ? "Submitting…" : "Request payment"}</Button></form>
    {message ? <p className="mt-3 rounded-lg bg-white p-3 text-sm text-blue-900">{message}</p> : null}
    <div className="mt-4 grid gap-2">{requests.map((item) => <div key={item.id} className="rounded-xl bg-white p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{item.currency}{item.amount}</span><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "PAID" ? "bg-green-100 text-green-800" : item.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{item.status}</span></div><p className="mt-1 text-xs text-slate-500">Requested {new Date(item.createdAt).toLocaleString()}{item.rejectionReason ? ` • ${item.rejectionReason}` : ""}</p>{item.receiptUrl ? <a href={item.receiptUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-green-700 hover:underline">View payment receipt</a> : null}</div>)}</div>
    {requests.length === 0 ? <p className="mt-3 text-sm text-blue-800">No payment requests yet.</p> : null}
    <SecondaryButton className="mt-3" type="button" onClick={load}>Refresh payment history</SecondaryButton>
  </Card>;
}
