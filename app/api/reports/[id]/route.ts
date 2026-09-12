import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusUpdateSchema } from "@/lib/validations";
import { notifyUser } from "@/lib/notifications";
import { audit } from "@/lib/audit";
import { awardPoints, POINTS } from "@/lib/gamification";

const TERMINAL: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED", "CANCELLED"],
  VERIFIED: ["ASSIGNED", "REJECTED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["COLLECTED", "CANCELLED"],
  COLLECTED: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user as unknown as { id: string; role: string };
  const report = await prisma.wasteReport.findUnique({
    where: { id: params.id },
    include: { images: true, collectionPoint: true, reporter: { select: { id: true, fullName: true, email: true } }, assignments: { include: { collector: { select: { id: true, fullName: true } } } }, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role === "PUBLIC" && report.reporterId !== me.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (me.role === "COLLECTOR") {
    const mine = report.assignments.some((a) => (a.collector as unknown as { id: string }).id === me.id);
    if (!mine && report.reporterId !== me.id) {
      // allow collectors to see assigned only; admins see all
      const anyAssign = await prisma.collectorAssignment.findFirst({ where: { reportId: report.id, collectorId: me.id } });
      if (!anyAssign) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.json({ report });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = session.user as unknown as { id: string; role: string };
    const body = await req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });

    const report = await prisma.wasteReport.findUnique({ where: { id: params.id }, include: { assignments: true } });
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = me.role === "ADMIN" || me.role === "SUPER_ADMIN";
    const isCollector = me.role === "COLLECTOR";
    const activeAssign = await prisma.collectorAssignment.findFirst({ where: { reportId: report.id, collectorId: me.role === "COLLECTOR" ? me.id : undefined }, orderBy: { assignedAt: "desc" } });

    // Authorization matrix
    if (me.role === "PUBLIC") {
      if (!(parsed.data.status === "CANCELLED" && report.reporterId === me.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isCollector) {
      const allowedCollector = ["ACCEPTED", "ON_THE_WAY", "COLLECTED", "COMPLETED"];
      if (!allowedCollector.includes(parsed.data.status)) return NextResponse.json({ error: "Collectors can only progress assigned jobs" }, { status: 403 });
      if (!activeAssign && report.reporterId !== me.id) return NextResponse.json({ error: "Not your assignment" }, { status: 403 });
    }
    if (!isAdmin && !isCollector && me.role !== "PUBLIC") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Validate transition loosely (admins can override)
    if (!isAdmin) {
      const allowed = TERMINAL[report.status] ?? [];
      if (!allowed.includes(parsed.data.status) && report.status !== parsed.data.status) {
        return NextResponse.json({ error: `Cannot move from ${report.status} to ${parsed.data.status}` }, { status: 400 });
      }
    }

    const updated = await prisma.wasteReport.update({
      where: { id: report.id },
      data: {
        status: parsed.data.status as never,
        priority: (parsed.data.priority as never) ?? undefined,
        internalNote: parsed.data.internalNote || undefined,
        completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined,
        wasteAmountKg: body.wasteAmountKg ? Number(body.wasteAmountKg) : undefined,
      },
    });

    await prisma.reportStatusHistory.create({
      data: { reportId: report.id, oldStatus: report.status as never, newStatus: parsed.data.status as never, changedById: me.id, comment: parsed.data.comment || null },
    });

    // Completion photo
    if (body.completionPhoto && typeof body.completionPhoto === "string") {
      await prisma.reportImage.create({ data: { reportId: report.id, imageUrl: body.completionPhoto, type: "AFTER" as never } });
    }
    if (body.notes && activeAssign) {
      await prisma.collectorAssignment.update({ where: { id: activeAssign.id }, data: { notes: String(body.notes).slice(0, 1000), status: parsed.data.status === "COMPLETED" ? "COMPLETED" as never : activeAssign.status, completedAt: parsed.data.status === "COMPLETED" ? new Date() : undefined } });
    }

    // Side effects: points + notifications
    if (parsed.data.status === "VERIFIED") {
      await awardPoints(report.reporterId, POINTS.VERIFIED).catch(() => {});
      await notifyUser({ userId: report.reporterId, title: "Report verified", message: `${report.reportNumber} verified`, type: "REPORT_VERIFIED", reportId: report.id, link: `/reports/${report.id}` });
    }
    if (parsed.data.status === "COMPLETED") {
      await awardPoints(report.reporterId, POINTS.COMPLETED).catch(() => {});
      await notifyUser({ userId: report.reporterId, title: "Waste collected", message: `${report.reportNumber} completed. Thank you!`, type: "WASTE_COLLECTED", reportId: report.id, link: `/reports/${report.id}` });
    }
    if (parsed.data.status === "COLLECTED" || parsed.data.status === "ON_THE_WAY") {
      await notifyUser({ userId: report.reporterId, title: "Collection update", message: `${report.reportNumber} is ${parsed.data.status.replace(/_/g, " ").toLowerCase()}`, type: "COLLECTION_STARTED", reportId: report.id, link: `/reports/${report.id}` });
    }

    await audit({ actorId: me.id, action: `REPORT_${parsed.data.status}`, entity: "WasteReport", entityId: report.id });
    return NextResponse.json({ ok: true, report: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
