import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";

export async function notifyUser(opts: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  reportId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      message: opts.message,
      type: opts.type ?? "INFO",
      link: opts.link,
      reportId: opts.reportId,
    },
  });
}

export async function notifyAdmins(opts: { title: string; message: string; type?: NotificationType; link?: string; reportId?: string }) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return [];
  return prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: opts.title,
      message: opts.message,
      type: opts.type ?? "INFO",
      link: opts.link,
      reportId: opts.reportId,
    })),
  });
}

// Future extension points: sendEmail(), sendSms(), sendWhatsApp(), sendPush()
// MVP uses in-app notifications only. Keep these interfaces for later.
export interface OutboundChannel {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class NoopChannel implements OutboundChannel {
  async send() {
    return;
  }
}
