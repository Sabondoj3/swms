import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    SUBMITTED: "bg-slate-100 text-slate-700",
    UNDER_REVIEW: "bg-amber-100 text-amber-800",
    VERIFIED: "bg-blue-100 text-blue-800",
    ASSIGNED: "bg-violet-100 text-violet-800",
    ACCEPTED: "bg-indigo-100 text-indigo-800",
    ON_THE_WAY: "bg-cyan-100 text-cyan-800",
    COLLECTED: "bg-teal-100 text-teal-800",
    COMPLETED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-zinc-200 text-zinc-600",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

export function priorityColor(p: string) {
  const map: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };
  return map[p] ?? "bg-slate-100 text-slate-700";
}
