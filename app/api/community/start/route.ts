import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createCommunityAccessToken } from "@/lib/community-access";

const communitySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().min(5).max(40).optional().or(z.literal("")),
  institution: z.string().trim().max(160).optional().or(z.literal("")),
  terms: z.literal(true),
}).refine((value) => Boolean(value.email || value.phone), { message: "Enter an email address or phone number so we can contact you about the report" });

export async function POST(req: Request) {
  try {
    const parsed = communitySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your information" }, { status: 400 });
    const data = parsed.data;
    const email = data.email?.toLowerCase() || `community-${crypto.randomUUID()}@guest.swms.local`;
    const existing = data.email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (existing && existing.role !== "PUBLIC") return NextResponse.json({ error: "That email belongs to a staff account. Use the Admin or Collector login." }, { status: 409 });
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { fullName: data.fullName, phone: data.phone || null, institution: data.institution || null, isActive: true } })
      : await prisma.user.create({ data: { fullName: data.fullName, email, phone: data.phone || null, institution: data.institution || null, passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("base64url"), 12), role: "PUBLIC" } });
    return NextResponse.json({ ok: true, token: createCommunityAccessToken(user.id) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "We could not start community reporting. Please try again." }, { status: 500 });
  }
}
