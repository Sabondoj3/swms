import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { role?: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Only Admins can view confirmation records" }, { status: 403 });
  }

  const reports = await prisma.wasteReport.findMany({
    where: {
      OR: [
        { status: "COLLECTED" },
        { status: "COMPLETED", collectorPayment: null },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      images: { orderBy: { createdAt: "desc" } },
      reporter: { select: { fullName: true, phone: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        take: 1,
        include: { collector: { select: { id: true, fullName: true, phone: true } } },
      },
      collectorPayment: { select: { id: true, collectorId: true, amount: true, currency: true, status: true, confirmedAt: true } },
    },
  });

  return NextResponse.json({ reports });
}
