"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui/primitives";

export default function CommunityReporterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", institution: "", terms: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/community/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.token) {
      setLoading(false);
      setError(data?.error ?? "Please check your contact information and try again.");
      return;
    }
    const session = await signIn("community", { token: data.token, redirect: false });
    if (!session || session.error) {
      setLoading(false);
      setError("We could not start your community reporting session. Please try again.");
      return;
    }
    router.push("/report");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <div className="rounded-xl bg-green-50 p-3 text-sm leading-5 text-green-900">Tell us who you are so the SWMS team can follow up on your report. No password is needed for community reporting.</div>
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div><Label>Full name</Label><Input required value={form.fullName} onChange={(event) => set("fullName", event.target.value)} placeholder="Your name" autoComplete="name" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Phone number</Label><Input type="tel" value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="+263…" autoComplete="tel" /></div><div><Label>Email address</Label><Input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="you@example.com" autoComplete="email" /></div></div>
      <p className="-mt-2 text-xs text-slate-500">Provide at least a phone number or email address.</p>
      <div><Label>Community, institution, or locality <span className="font-normal text-slate-400">(optional)</span></Label><Input value={form.institution} onChange={(event) => set("institution", event.target.value)} placeholder="Where are you reporting from?" /></div>
      <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.terms} onChange={(event) => set("terms", event.target.checked)} className="mt-1" /> I confirm these details are genuine and agree that SWMS may contact me about this report.</label>
      <Button disabled={loading}>{loading ? "Opening report form…" : "Continue to report waste"}</Button>
    </form>
  );
}
