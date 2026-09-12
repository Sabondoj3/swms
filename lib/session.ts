import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser(roles?: string[]) {
  const session = await getSession();
  if (!session?.user) return null;
  const u = session.user as unknown as { id: string; role: string };
  if (roles && !roles.includes(u.role)) return null;
  const db = await prisma.user.findUnique({ where: { id: u.id } });
  if (!db || !db.isActive) return null;
  return { session, user: db };
}
