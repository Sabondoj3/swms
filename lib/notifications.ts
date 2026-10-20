import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";
import { sendPushToUsers } from "./push";

export async function notifyUser(opts: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  reportId?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      message: opts.message,
      type: opts.type ?? "INFO",
      link: opts.link,
      reportId: opts.reportId,
    },
  });
  await sendPushToUsers([opts.userId], { title: opts.title, message: opts.message, link: opts.link }).catch(() => {});
  return notification;
}

export async function notifyAdmins(opts: { title: string; message: string; type?: NotificationType; link?: string; reportId?: string }) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return { count: 0 };
  const result = await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: opts.title,
      message: opts.message,
      type: opts.type ?? "INFO",
      link: opts.link,
      reportId: opts.reportId,
    })),
  });
  await sendPushToUsers(admins.map((admin) => admin.id), { title: opts.title, message: opts.message, link: opts.link }).catch(() => {});
  return result;
}

// Future extension points: sendEmail(), sendSms(), sendWhatsApp(), sendPush()
// MVP uses in-app notifications and optional Web Push delivery.
export interface OutboundChannel {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class NoopChannel implements OutboundChannel {
  async send() {
    return;
  }
}
