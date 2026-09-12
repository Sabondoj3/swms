import { prisma } from "./prisma";

export async function audit(opts: { actorId?: string | null; action: string; entity: string; entityId?: string; metadata?: Record<string, unknown> }) {
  try {
    await prisma.auditLog.create({
      data: { actorId: opts.actorId ?? undefined, action: opts.action, entity: opts.entity, entityId: opts.entityId, metadata: opts.metadata as never },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
