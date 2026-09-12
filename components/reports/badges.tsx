import { statusColor, priorityColor } from "@/lib/utils";
import { Badge } from "@/components/ui/primitives";

const ORDER = ["SUBMITTED","UNDER_REVIEW","VERIFIED","ASSIGNED","ACCEPTED","ON_THE_WAY","COLLECTED","COMPLETED"];

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusColor(status)}>{status.replace(/_/g, " ")}</Badge>;
}
export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge className={priorityColor(priority)}>{priority}</Badge>;
}

export function Timeline({ current }: { current: string }) {
  if (current === "REJECTED" || current === "CANCELLED") return <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{current}</div>;
  const idx = ORDER.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2">
      {ORDER.map((s, i) => (
        <li key={s} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${i <= idx ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>{s.replace(/_/g, " ")}</li>
      ))}
    </ol>
  );
}
