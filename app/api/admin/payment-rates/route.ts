import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const categories = ["PLASTIC", "PAPER", "FOOD_ORGANIC", "METAL", "GLASS", "E_WASTE", "MIXED", "HAZARDOUS", "OTHER"] as const;
const ratesSchema = z.object({ rates: z.array(z.object({ wasteCategory: z.enum(categories), amount: z.number().int().min(0).max(100000), currency: z.literal("SLE").default("SLE") })).length(categories.length) });

function getAdmin(session: unknown) {
  const user = (session as { user?: { id?: string; role?: string } } | null)?.user;
  return user?.id && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") ? user : null;
}

export async function GET() {
  try {
    const admin = getAdmin(await getServerSession(authOptions));
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const saved = await prisma.collectorRate.findMany({ orderBy: { wasteCategory: "asc" } });
    const rates = categories.map((wasteCategory) => saved.find((rate) => rate.wasteCategory === wasteCategory) ?? { wasteCategory, amount: 50, currency: "SLE" });
    return NextResponse.json({ rates });
  } catch (error) {
    console.error("payment rates lookup failed", error);
    return NextResponse.json({ error: "Payment rate storage is not available. Apply the collector-rate migration first." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = getAdmin(await getServerSession(authOptions));
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const parsed = ratesSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payment rates" }, { status: 400 });
    await prisma.$transaction(parsed.data.rates.map((rate) => prisma.collectorRate.upsert({ where: { wasteCategory: rate.wasteCategory }, create: rate, update: { amount: rate.amount, currency: rate.currency } })));
    await audit({ actorId: admin.id, action: "UPDATE_COLLECTOR_RATES", entity: "CollectorRate", metadata: { rates: parsed.data.rates } });
    return NextResponse.json({ ok: true, rates: parsed.data.rates });
  } catch (error) {
    console.error("payment rates update failed", error);
    return NextResponse.json({ error: "Payment rates could not be saved. Apply the collector-rate migration first." }, { status: 503 });
  }
}
