"use client";

import { Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import { ROLE_HOME } from "@/lib/constants";
import CommunityReporterForm from "./CommunityReporterForm";

type LoginRole = "ADMIN" | "COLLECTOR" | "PUBLIC";
type RoleOption = { value: LoginRole; label: string; eyebrow: string; description: string; destination: string };

const ROLE_OPTIONS: RoleOption[] = [
  { value: "ADMIN", label: "Admin", eyebrow: "Operations control", description: "See reports, collectors, smart bins, alerts, analytics, and all system activity.", destination: "/admin" },
  { value: "COLLECTOR", label: "Collector", eyebrow: "Field workflow", description: "View assigned jobs, navigate to collection points, and record completed collections.", destination: "/collector" },
  { value: "PUBLIC", label: "Citizen", eyebrow: "Community reporting", description: "Report waste, scan QR points, follow your reports, and learn about responsible disposal.", destination: "/dashboard" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role")?.toUpperCase();
  const [role, setRole] = useState<LoginRole>(initialRole === "ADMIN" || initialRole === "COLLECTOR" ? initialRole : "PUBLIC");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = useMemo(() => ROLE_OPTIONS.find((option) => option.value === role) ?? ROLE_OPTIONS[2], [role]);

  function selectRole(nextRole: LoginRole) {
    setRole(nextRole);
    setErr("");
    const callbackUrl = params.get("callbackUrl");
    const query = new URLSearchParams({ role: nextRole.toLowerCase() });
    if (callbackUrl) query.set("callbackUrl", callbackUrl);
    router.replace(`/login?${query.toString()}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, workflowRole: role, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setErr(`We couldn't sign you in as a ${selected.label.toLowerCase()}. Check your credentials and choose the account type assigned to you.`);
      return;
    }
    const session = await fetch("/api/auth/session").then((response) => response.json()).catch(() => null);
    const actualRole = (session?.user as { role?: string } | undefined)?.role ?? role;
    const callbackUrl = params.get("callbackUrl");
    const safeCallback = callbackUrl && isAllowedDestination(callbackUrl, actualRole) ? callbackUrl : ROLE_HOME[actualRole] ?? selected.destination;
    router.push(safeCallback);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-green-700">← Back to SWMS home</Link>
        <div className="mt-8 grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-700">SWMS access</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Sign in to your workflow</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Choose the account type that matches your SWMS role. Each role opens only the tools it needs, while administrators can review the full operation.</p>
            <div className="mt-6 space-y-3">
              {ROLE_OPTIONS.map((option) => {
                const active = option.value === role;
                return <button key={option.value} type="button" onClick={() => selectRole(option.value)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-green-600 bg-green-50 shadow-sm ring-2 ring-green-100" : "border-slate-200 bg-white hover:border-green-300"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{option.eyebrow}</p><p className="mt-1 text-lg font-bold text-slate-900">{option.label} login</p><p className="mt-1 text-sm leading-5 text-slate-600">{option.description}</p></div><span className={`mt-1 grid h-5 w-5 place-items-center rounded-full border ${active ? "border-green-600 bg-green-600" : "border-slate-300"}`}>{active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}</span></div></button>;
              })}
            </div>
          </section>
          <Card className="bg-white p-6 shadow-sm md:p-8">
            <div className="border-b border-slate-100 pb-5"><p className="text-sm font-semibold text-green-700">{selected.eyebrow}</p><h2 className="mt-1 text-2xl font-extrabold">{role === "PUBLIC" ? "Start community reporting" : `${selected.label} login`}</h2><p className="mt-1 text-sm text-slate-500">{role === "PUBLIC" ? "Share your contact information, then report waste." : `Continue to ${selected.destination}`}</p></div>
            {role === "PUBLIC" ? <CommunityReporterForm /> : <>
              <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                {err ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p> : null}
                <div><Label>Email address</Label><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${selected.label.toLowerCase()}@swms.local`} /></div>
                <div><Label>Password</Label><div className="relative"><Input type={show ? "text" : "password"} required autoComplete={remember ? "current-password" : "off"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-xs font-semibold text-green-700">{show ? "Hide" : "Show"}</button></div></div>
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
                <Button disabled={loading}>{loading ? "Signing in…" : `Sign in as ${selected.label}`}</Button>
              </form>
              <p className="mt-5 text-center text-xs text-slate-500">Admin and collector accounts are issued by an authorized SWMS administrator.</p>
            </>}
          </Card>
        </div>
      </div>
    </main>
  );
}

function isAllowedDestination(destination: string, actualRole: string) {
  const path = destination.startsWith("/") ? destination : "/";
  if (actualRole === "ADMIN" || actualRole === "SUPER_ADMIN") return true;
  if (actualRole === "COLLECTOR") return path.startsWith("/collector") || path.startsWith("/notifications") || path.startsWith("/points");
  return path.startsWith("/dashboard") || path.startsWith("/report") || path.startsWith("/reports") || path.startsWith("/my-reports") || path.startsWith("/scan") || path.startsWith("/points") || path.startsWith("/notifications");
}

export default function LoginPage() {
  return <Suspense fallback={<main className="p-8 text-sm">Loading…</main>}><LoginForm /></Suspense>;
}
