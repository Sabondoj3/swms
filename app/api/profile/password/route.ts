import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string().min(1, "Please confirm the new password"),
}).refine((data) => data.newPassword === data.confirmPassword, { message: "New passwords do not match", path: ["confirmPassword"] });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user as unknown as { id: string };
  const parsed = passwordSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid password" }, { status: 400 });
  const { currentPassword, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { id: true, passwordHash: true, isActive: true } });
  if (!user || !user.isActive) return NextResponse.json({ error: "Account is unavailable" }, { status: 403 });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  if (await bcrypt.compare(newPassword, user.passwordHash)) return NextResponse.json({ error: "Choose a password different from the current password" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await audit({ actorId: user.id, action: "CHANGE_PASSWORD", entity: "User", entityId: user.id });
  return NextResponse.json({ ok: true, message: "Password changed successfully" });
}
