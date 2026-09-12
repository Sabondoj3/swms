import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignSchema } from "@/lib/validations";
import { notifyUser } from "@/lib/notifications";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = session.user as unknown as { id: string; role: string };
    if (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const collector = await prisma.user.findUnique({ where: { id: parsed.data.collectorId } });
    if (!collector || collector.role !== "COLLECTOR") return NextResponse.json({ error: "Collector not found" }, { status: 404 });
    const report = await prisma.wasteReport.findUnique({ where: { id: parsed.data.reportId } });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // Cancel previous active assignments
    await prisma.collectorAssignment.updateMany({ where: { reportId: report.id, status: { in: ["ASSIGNED", "ACCEPTED", "ON_THE_WAY"] } }, data: { status: "CANCELLED" as never } });
    const assignment = await prisma.collectorAssignment.create({
      data: { reportId: report.id, collectorId: collector.id, assignedBy: me.id, status: "ASSIGNED" as never, notes: parsed.data.notes || null },
    });
    await prisma.wasteReport.update({ where: { id: report.id }, data: { status: report.status === "SUBMITTED" || report.status === "UNDER_REVIEW" || report.status === "VERIFIED" ? "ASSIGNED" as never : undefined } });
    await prisma.reportStatusHistory.create({ data: { reportId: report.id, oldStatus: report.status as never, newStatus: "ASSIGNED" as never, changedById: me.id, comment: `Assigned to ${collector.fullName}` } });
    await notifyUser({ userId: collector.id, title: "New assignment", message: `${report.reportNumber} — ${report.address}`, type: "NEW_ASSIGNMENT", reportId: report.id, link: "/collector" });
    await notifyUser({ userId: report.reporterId, title: "Collector assigned", message: `${report.reportNumber} assigned`, type: "COLLECTOR_ASSIGNED", reportId: report.id, link: `/reports/${report.id}` });
    await audit({ actorId: me.id, action: "ASSIGN_COLLECTOR", entity: "WasteReport", entityId: report.id, metadata: { collectorId: collector.id } });
    return NextResponse.json({ ok: true, assignment });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }
}
