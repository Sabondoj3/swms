import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validations";
import { generateReportNumber } from "@/lib/report-number";
import { suggestPriority } from "@/lib/classification";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = session.user as unknown as { id: string; role: string };
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const mine = url.searchParams.get("mine");
    const where: Record<string, unknown> = {};
    if (mine === "1" || me.role === "PUBLIC") {
      if (me.role === "PUBLIC") where.reporterId = me.id;
      else if (mine === "1") where.reporterId = me.id;
    }
    if (me.role === "COLLECTOR" && mine !== "1") {
      const assigns = await prisma.collectorAssignment.findMany({ where: { collectorId: me.id }, select: { reportId: true } });
      where.id = { in: assigns.map((a) => a.reportId) };
    }
    if (status && status !== "ALL") {
      if (status === "ACTIVE") where.status = { notIn: ["COMPLETED", "REJECTED", "CANCELLED"] };
      else if (status === "COMPLETED") where.status = "COMPLETED";
      else if (status === "REJECTED") where.status = "REJECTED";
      else where.status = status;
    }
    const q = url.searchParams.get("q");
    if (q) where.OR = [{ reportNumber: { contains: q, mode: "insensitive" } }, { address: { contains: q, mode: "insensitive" } }];
    const reports = await prisma.wasteReport.findMany({
      where: where as never,
      include: { images: true, collectionPoint: true, reporter: { select: { fullName: true, email: true } }, assignments: { include: { collector: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ reports });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = session.user as unknown as { id: string };
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    const d = parsed.data;
    let collectionPointId: string | null = null;
    if (d.collectionPointId) {
      const cp = await prisma.collectionPoint.findUnique({ where: { id: d.collectionPointId } });
      if (!cp) return NextResponse.json({ error: "Collection point not found" }, { status: 404 });
      collectionPointId = cp.id;
    }
    const priority = (d.priority as never) ?? (suggestPriority(d.problemType, d.wasteCategory) as never);
    const reportNumber = await generateReportNumber();
    const report = await prisma.wasteReport.create({
      data: {
        reportNumber,
        reporterId: me.id,
        collectionPointId,
        latitude: d.latitude,
        longitude: d.longitude,
        address: d.address,
        wasteCategory: d.wasteCategory as never,
        problemType: d.problemType as never,
        description: d.description || null,
        priority: priority as never,
        status: "SUBMITTED" as never,
        images: { create: (d.imageUrls ?? []).map((u) => ({ imageUrl: u, type: "BEFORE" as never })) },
        history: { create: [{ newStatus: "SUBMITTED" as never, comment: "Report submitted" }] },
      },
      include: { images: true },
    });
    await notifyAdmins({ title: "New waste report", message: `${reportNumber} — ${d.address}`, type: priority === "CRITICAL" ? "CRITICAL_REPORT" : "REPORT_SUBMITTED", link: `/admin/reports/${report.id}`, reportId: report.id });
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
