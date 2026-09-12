import { prisma } from "./prisma";

const BADGES = [
  { code: "ECO_REPORTER", name: "Eco Reporter", description: "First verified report", pointsRequired: 10 },
  { code: "GREEN_CHAMPION", name: "Green Champion", description: "5 resolved reports", pointsRequired: 50 },
  { code: "COMMUNITY_PROTECTOR", name: "Community Protector", description: "15 resolved reports", pointsRequired: 150 },
];

export async function ensureBadges() {
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }
}

export async function awardPoints(userId: string, points: number) {
  const user = await prisma.user.update({ where: { id: userId }, data: { points: { increment: points } } });
  await ensureBadges();
  const badges = await prisma.badge.findMany({ where: { pointsRequired: { lte: user.points } } });
  for (const badge of badges) {
    await prisma.userBadge.upsert({ where: { userId_badgeId: { userId, badgeId: badge.id } }, update: {}, create: { userId, badgeId: badge.id } });
  }
  return user;
}

// Points only after verification to avoid spam.
export const POINTS = { VERIFIED: 10, COMPLETED: 15 };
