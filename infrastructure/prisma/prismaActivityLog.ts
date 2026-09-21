import { Prisma, PrismaClient } from '@prisma/client';
import { ACTIVITY_ACTIONS, ActivityAction, ActivityDetails, ActivityEvent, ActivitySubject } from '@/core/entities/activity';
import { ActivityLog } from '@/core/ports/activityLog';

type ActivityRecord = {
  id: string
  at: string
  actorId: string
  actorName: string
  action: string
  subjects: Prisma.JsonValue
  details: Prisma.JsonValue
}

const isKnownAction = (action: string): action is ActivityAction =>
  (ACTIVITY_ACTIONS as readonly string[]).includes(action);

const toEvent = (record: ActivityRecord): ActivityEvent | null =>
  isKnownAction(record.action)
    ? {
      id: record.id,
      at: record.at,
      actor: { id: record.actorId, name: record.actorName },
      action: record.action,
      subjects: (Array.isArray(record.subjects) ? record.subjects : []) as unknown as ActivitySubject[],
      details: (record.details && typeof record.details === 'object' ? record.details : {}) as ActivityDetails,
    }
    : null;

export const createPrismaActivityLog = (prisma: PrismaClient): ActivityLog => ({
  record: async (event) => {
    await prisma.activityEvent.create({
      data: {
        at: event.at,
        actorId: event.actor.id,
        actorName: event.actor.name,
        action: event.action,
        subjects: event.subjects as unknown as Prisma.InputJsonValue,
        details: event.details as unknown as Prisma.InputJsonValue,
      },
    });
  },

  list: async ({ limit, actorId }) => {
    // _id of MongoDB grows with time, so it orders the journal without an index of its own
    const records = await prisma.activityEvent.findMany({
      where: actorId ? { actorId } : {},
      orderBy: { id: 'desc' },
      take: limit,
    });

    // a record written by a newer version of the application is skipped, not shown as something else
    return records.map(toEvent).filter((event): event is ActivityEvent => event !== null);
  },

  listActors: async () => {
    const records = await prisma.activityEvent.findMany({
      distinct: ['actorId'],
      select: { actorId: true, actorName: true },
      orderBy: { id: 'desc' },
    });

    return records.map(record => ({ id: record.actorId, name: record.actorName }));
  },
});
