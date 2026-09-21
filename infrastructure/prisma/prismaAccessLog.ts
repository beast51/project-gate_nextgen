import { PrismaClient } from '@prisma/client';
import { ACCESS_EVENT_KINDS, AccessEvent, AccessEventKind, ACCESS_LOG_RETENTION_DAYS } from '@/core/entities/access';
import { AccessLog } from '@/core/ports/accessLog';

type AccessRecord = {
  id: string
  at: Date
  actorId: string
  actorName: string
  kind: string
  path: string | null
  ip: string | null
  device: string | null
}

const isKnownKind = (kind: string): kind is AccessEventKind => (ACCESS_EVENT_KINDS as readonly string[]).includes(kind);

const toEvent = (record: AccessRecord): AccessEvent | null =>
  isKnownKind(record.kind)
    ? {
      id: record.id,
      at: record.at.toISOString(),
      actor: { id: record.actorId, name: record.actorName },
      kind: record.kind,
      path: record.path,
      ip: record.ip,
      device: record.device,
    }
    : null;

// Databases appear on the fly (every demo sandbox is one), so nobody can create the index by hand.
// createIndexes is idempotent; it runs once per database per server instance, before the first record.
const ensured = new WeakMap<PrismaClient, Promise<void>>();

const ensureRetention = (prisma: PrismaClient, retentionDays: number) => {
  if (!ensured.has(prisma)) {
    ensured.set(prisma, (async () => {
      try {
        await prisma.$runCommandRaw({
          createIndexes: 'AccessEvent',
          indexes: [{ key: { at: 1 }, name: 'AccessEvent_retention', expireAfterSeconds: retentionDays * 24 * 60 * 60 }],
        });
      } catch (error) {
        // without the index the journal still works, it just does not clean itself: worth knowing, not worth failing
        console.error('Failed to create the retention index of the access journal', error);
      }
    })());
  }

  return ensured.get(prisma)!;
};

export const createPrismaAccessLog = (
  prisma: PrismaClient,
  { retentionDays = ACCESS_LOG_RETENTION_DAYS }: { retentionDays?: number } = {},
): AccessLog => ({
  record: async (event) => {
    await ensureRetention(prisma, retentionDays);

    await prisma.accessEvent.create({
      data: {
        at: new Date(event.at),
        actorId: event.actor.id,
        actorName: event.actor.name,
        kind: event.kind,
        path: event.path,
        ip: event.ip,
        device: event.device,
      },
    });
  },

  list: async ({ limit, actorId }) => {
    const records = await prisma.accessEvent.findMany({
      where: actorId ? { actorId } : {},
      orderBy: { id: 'desc' },
      take: limit,
    });

    return records.map(toEvent).filter((event): event is AccessEvent => event !== null);
  },

  listActors: async () => {
    const records = await prisma.accessEvent.findMany({
      distinct: ['actorId'],
      select: { actorId: true, actorName: true },
      orderBy: { id: 'desc' },
    });

    return records.map(record => ({ id: record.actorId, name: record.actorName }));
  },
});
