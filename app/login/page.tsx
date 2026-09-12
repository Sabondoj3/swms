"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import { ROLE_HOME } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: params.get("callbackUrl") ?? undefined });
    setLoading(false);
    if (!res || res.error) { setErr("Invalid email or password"); return; }
    // Fetch session to decide home
    const s = await fetch("/api/auth/session").then((r) => r.json()).catch(() => null);
    const role = (s?.user as { role?: string } | undefined)?.role ?? "PUBLIC";
    const cb = params.get("callbackUrl");
    router.push(cb ?? ROLE_HOME[role] ?? "/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link href="/" className="text-sm text-green-700">← Home</Link>
      <h1 className="mt-4 text-2xl font-extrabold">Welcome back</h1>
      <p className="text-sm text-slate-500">Login to continue to SWMS</p>
      <Card className="mt-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          {err ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p> : null}
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campus.edu" /></div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-xs font-semibold text-green-700">{show ? "Hide" : "Show"}</button>
            </div>
          </div>
          <label className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</span>
            <span className="text-slate-400">Forgot password? Contact admin (MVP)</span>
          </label>
          <Button disabled={loading}>{loading ? "Signing in…" : "Login"}</Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm">No account? <Link href="/register" className="font-semibold text-green-700">Register</Link></p>
      <div className="mt-6 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">Demo: admin@swms.local / Admin123! • collector@swms.local / Collector123! • student@swms.local / Student123!</div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="p-8 text-sm">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
