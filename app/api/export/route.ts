import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { role: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const reports = await prisma.wasteReport.findMany({
    where: status && status !== "ALL" ? { status: status as never } : {},
    include: { reporter: { select: { fullName: true, email: true } }, collectionPoint: { select: { code: true, name: true } }, assignments: { include: { collector: { select: { fullName: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const header = "reportNumber,date,reporter,location,problem,wasteCategory,priority,status,collector\n";
  const rows = reports.map((r) => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [r.reportNumber, new Date(r.createdAt).toISOString(), (r.reporter as unknown as { fullName: string }).fullName, r.address, r.problemType, r.wasteCategory, r.priority, r.status, r.assignments[0]?.collector ? (r.assignments[0].collector as unknown as { fullName: string }).fullName : ""].map(esc).join(",");
  });
  const csv = header + rows.join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=swms-reports.csv" } });
}
