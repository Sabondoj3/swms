import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { role: string } | undefined;
  if (!me || me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { fullName: true, email: true } } } });
  return NextResponse.json({ logs });
}
