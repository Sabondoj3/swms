"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card } from "@/components/ui/primitives";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "", institution: "", studentId: "", terms: false });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!form.terms) { setErr("You must accept the terms"); return; }
    setLoading(true);
    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, terms: true }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error ?? "Registration failed"); return; }
    router.push("/login?registered=1");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link href="/" className="text-sm text-green-700">← Home</Link>
      <h1 className="mt-4 text-2xl font-extrabold">Create account</h1>
      <p className="text-sm text-slate-500">Join your campus cleanup community</p>
      <Card className="mt-6">
        <form onSubmit={submit} className="flex flex-col gap-3">
          {err ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p> : null}
          <div><Label>Full name</Label><Input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></div>
          <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label>Phone number</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+263…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Institution (optional)</Label><Input value={form.institution} onChange={(e) => set("institution", e.target.value)} /></div>
            <div><Label>Student ID (optional)</Label><Input value={form.studentId} onChange={(e) => set("studentId", e.target.value)} /></div>
          </div>
          <div><Label>Password (min 8, upper+lower+number)</Label><Input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
          <div><Label>Confirm password</Label><Input required type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} /></div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-1" /> I accept the terms and agree to submit only genuine waste reports.</label>
          <Button disabled={loading}>{loading ? "Creating…" : "Register"}</Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm">Have an account? <Link href="/login" className="font-semibold text-green-700">Login</Link></p>
    </main>
  );
}
