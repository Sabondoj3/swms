import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { Footer, MobileNav, TopBar } from "@/components/layout/nav";

const pages = [
  {
    title: "See the problem clearly",
    eyebrow: "1 of 4 · Understand",
    message: "Every overflowing bin, illegal dump, and missed collection is a signal. When the community reports what it sees, SWMS turns that signal into action.",
    heading: "Cleaner decisions start with better evidence",
    body: "Waste problems are difficult to solve when they stay invisible. A photo, location, and short description help the team understand what is happening and where help is needed first.",
    image: "/problem-overflow.svg",
    bullets: ["Overflowing bins can make public spaces unsafe.", "Illegal dumping is easier to solve when it is recorded.", "Reliable reports reveal patterns that teams can act on."],
  },
  {
    title: "Learn how one report moves",
    eyebrow: "2 of 4 · Follow the journey",
    message: "Your report does not disappear into a queue. It creates a visible trail from community observation to verified collection.",
    heading: "One report. A complete response.",
    body: "SWMS connects citizens, administrators, and collectors so everyone understands the next step and the status of the work.",
    bullets: ["1. Select a location and describe the waste.", "2. Add a photo or other useful evidence.", "3. Admin verifies the report and assigns a collector.", "4. Collector completes the work and uploads proof."],
  },
  {
    title: "Choose your way to help",
    eyebrow: "3 of 4 · Know your role",
    message: "A cleaner community is a shared responsibility. SWMS gives each person a focused workflow so the right action happens at the right time.",
    heading: "The right tools for every role",
    body: "You will choose your workflow on the next screen. The system keeps each role focused while giving administrators a complete view of operations.",
    roles: [
      ["Citizen", "Report waste, add evidence, follow your reports, and learn responsible disposal."],
      ["Collector", "View assigned jobs, navigate to locations, and record completed collections."],
      ["Admin", "Verify reports, assign collectors, monitor progress, and use analytics to improve service."],
    ],
  },
  {
    title: "Start making a difference",
    eyebrow: "4 of 4 · Take action",
    message: "You are ready to turn a waste concern into a coordinated response. Start with the workflow that matches your role.",
    heading: "Small reports create visible change",
    body: "Whether you are reporting a problem, completing a collection, or coordinating the whole operation, your next action helps build a cleaner and more accountable community.",
    bullets: ["Citizens can begin community reporting without a password.", "Collectors receive secure credentials from an administrator.", "Administrators can verify reports and assign the right collector."],
  },
] as const;

export function generateStaticParams() {
  return pages.map((_, index) => ({ step: String(index + 1) }));
}

export default function OnboardingPage({ params }: { params: { step: string } }) {
  const index = Number(params.step) - 1;
  const page = pages[index];
  if (!page) notFound();
  const first = index === 0;
  const last = index === pages.length - 1;
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <TopBar />
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center px-4 py-10">
        <div className="mb-8 flex items-center justify-between gap-4"><Link href="/" className="text-sm font-semibold text-green-700 hover:underline">← SWMS home</Link><span className="text-sm font-semibold text-slate-500">{page.eyebrow}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${((index + 1) / pages.length) * 100}%` }} /></div>
        <section className="mt-8 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-green-700">Interactive SWMS guide</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{page.title}</h1><p className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-medium leading-6 text-green-900">{page.message}</p><p className="mt-5 text-lg font-bold text-slate-900">{page.heading}</p><p className="mt-2 leading-7 text-slate-600">{page.body}</p></div>
          <Card className="overflow-hidden p-0 shadow-md">{"image" in page ? <img src={page.image} alt="Waste management evidence" className="h-64 w-full object-cover" /> : <div className="grid min-h-64 place-items-center bg-gradient-to-br from-green-700 to-emerald-500 p-8 text-center text-white"><p className="text-2xl font-extrabold">Observe.<br />Report.<br />Respond.</p></div>}<div className="p-6">{"bullets" in page ? <ul className="space-y-3">{page.bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-600" />{bullet}</li>)}</ul> : <div className="space-y-3">{page.roles?.map(([role, description]) => <div key={role} className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-green-700">{role}</p><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p></div>)}</div>}</div></Card>
        </section>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3"><Link href={first ? "/" : `/onboarding/${index}`} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-green-300">{first ? "Back home" : "← Previous"}</Link>{last ? <Link href="/login" className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700">Get Started →</Link> : <Link href={`/onboarding/${index + 2}`} className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700">Next page →</Link>}</div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
