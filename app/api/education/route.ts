import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { educationSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get("category");
  const posts = await prisma.educationalPost.findMany({ where: { published: true, ...(cat ? { category: cat } : {}) }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user as unknown as { role: string; id: string } | undefined;
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = educationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const post = await prisma.educationalPost.create({ data: { ...parsed.data, authorId: me.id } });
  return NextResponse.json({ ok: true, post });
}
