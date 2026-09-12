import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`register:${ip}`, 10, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    const { fullName, email, phone, password, institution, studentId } = parsed.data;
    const normalized = email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email: normalized } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { fullName: fullName.trim(), email: normalized, phone: phone || null, passwordHash, institution: institution || null, studentId: studentId || null, role: "PUBLIC" },
      select: { id: true, email: true, fullName: true },
    });
    await audit({ actorId: user.id, action: "REGISTER", entity: "User", entityId: user.id });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
