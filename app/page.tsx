import Link from "next/link";
import { TopBar, Footer, MobileNav } from "@/components/layout/nav";

export default function Home() {
  return (
    <div className="pb-20 md:pb-0">
      <TopBar />
      <main>
        <section className="bg-gradient-to-b from-green-700 to-green-600 text-white">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-green-100">Smart Waste Management System</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">Cleaner Communities Through Smart Technology</h1>
            <p className="mt-4 max-w-xl text-green-50">Report waste, improve collection, and help build a cleaner environment.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/report" className="rounded-xl bg-white px-6 py-3 font-semibold text-green-700">Report Waste</Link>
              <Link href="/#how" className="rounded-xl border border-white/40 px-6 py-3 font-semibold">Learn More</Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg text-center">
              {[["Fast reporting", "QR + photo"], ["Live tracking", "Status timeline"], ["Data driven", "Maps & analytics"]].map(([t, s]) => (
                <div key={t} className="rounded-2xl bg-white/10 p-3 backdrop-blur"><p className="text-sm font-bold">{t}</p><p className="text-xs text-green-100">{s}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-bold">The problem</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {["Overflowing bins", "Illegal dumping", "Missed collections", "No waste statistics"].map((x) => (
              <div key={x} className="rounded-2xl border bg-white p-4 text-sm font-medium shadow-sm">{x}</div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-xl font-bold">How SWMS works</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-5">
            {["Scan QR or pick location", "Upload photo", "Choose waste type", "Admin verifies & assigns", "Collector completes"].map((s, i) => (
              <li key={s} className="rounded-2xl bg-white p-4 shadow-sm border"><p className="text-2xl font-extrabold text-green-600">{i + 1}</p><p className="mt-1 text-sm font-medium">{s}</p></li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-bold">Features</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[["QR collection points", "Each bin has a unique code. Scan to auto-fill location."], ["Collector app", "Accept jobs, navigate, upload proof of collection."], ["Admin analytics", "Heat maps, response times, export CSV."], ["Notifications", "In-app updates for every status change."], ["Education", "Learn recycling and disposal."], ["Gamification", "Points and badges for verified reports."]].map(([t, d]) => (
              <div key={t} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-slate-500">{d}</p></div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-green-700 p-8 text-center text-white">
            <p className="text-xl font-bold">Help keep your campus clean today</p>
            <div className="mt-4 flex justify-center gap-3"><Link href="/register" className="rounded-xl bg-white px-5 py-3 font-semibold text-green-700">Get Started</Link><Link href="/education" className="rounded-xl border border-white/40 px-5 py-3">Waste Education</Link></div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
