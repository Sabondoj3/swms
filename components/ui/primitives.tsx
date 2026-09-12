import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return <button {...props} className={cn("inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation", className)} />;
}

export function SecondaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return <button {...props} className={cn("inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50", className)} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-100 bg-white p-4 shadow-sm", className)}>{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 ${props.className ?? ""}`} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-700">{children}</label>;
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", className)}>{children}</span>;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center"><p className="font-semibold text-slate-700">{title}</p>{hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}
