import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const me = session.user as {
    id: string;
  };

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      institution: true,
      studentId: true,
      points: true,
      isActive: true,
      createdAt: true,
      badges: {
        include: {
          badge: true,
        },
      },
      _count: {
        select: {
          reports: true,
          notifications: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const me = session.user as {
    id: string;
  };

  const body = await request.json();

  const fullName =
    typeof body.fullName === "string"
      ? body.fullName.trim()
      : undefined;

  const phone =
    typeof body.phone === "string"
      ? body.phone.trim()
      : undefined;

  const institution =
    typeof body.institution === "string"
      ? body.institution.trim()
      : undefined;

  const studentId =
    typeof body.studentId === "string"
      ? body.studentId.trim()
      : undefined;

  if (!fullName) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: me.id },
    data: {
      fullName,
      phone: phone || null,
      institution: institution || null,
      studentId: studentId || null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      institution: true,
      studentId: true,
      points: true,
      isActive: true,
    },
  });

  return NextResponse.json({ user });
}