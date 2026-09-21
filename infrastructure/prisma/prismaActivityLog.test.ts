import { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createPrismaActivityLog } from './prismaActivityLog';

const record = (overrides: Record<string, unknown> = {}) => ({
  id: '65f000000000000000000001',
  at: '2024-03-10T12:00:00.000Z',
  actorId: 'account-7',
  actorName: 'Yuriy',
  action: 'gateUserBlocked',
  subjects: [{ phoneNumber: '380501111111', name: 'Ivan', apartmentNumber: '12', carNumber: ['AA1111AA'] }],
  details: { blockedUntil: '2024-03-17 23:50:00' },
  ...overrides,
});

const prismaWith = (records: unknown[]) => {
  const activityEvent = {
    create: vi.fn(async () => ({})),
    findMany: vi.fn(async () => records),
  };
  return { prisma: { activityEvent } as unknown as PrismaClient, activityEvent };
};

describe('prismaActivityLog', () => {
  it('stores the actor flat and reads it back as an event', async () => {
    const { prisma, activityEvent } = prismaWith([record()]);
    const log = createPrismaActivityLog(prisma);

    await log.record({
      at: '2024-03-10T12:00:00.000Z', actor: { id: 'account-7', name: 'Yuriy' }, action: 'gateUserBlocked',
      subjects: [], details: {},
    });
    expect(activityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: 'account-7', actorName: 'Yuriy', action: 'gateUserBlocked' }),
    });

    expect(await log.list({ limit: 10 })).toEqual([{
      id: '65f000000000000000000001',
      at: '2024-03-10T12:00:00.000Z',
      actor: { id: 'account-7', name: 'Yuriy' },
      action: 'gateUserBlocked',
      subjects: [{ phoneNumber: '380501111111', name: 'Ivan', apartmentNumber: '12', carNumber: ['AA1111AA'] }],
      details: { blockedUntil: '2024-03-17 23:50:00' },
    }]);
  });

  it('asks for the newest records of one account', async () => {
    const { prisma, activityEvent } = prismaWith([]);

    await createPrismaActivityLog(prisma).list({ limit: 10, actorId: 'account-7' });

    expect(activityEvent.findMany).toHaveBeenCalledWith({ where: { actorId: 'account-7' }, orderBy: { id: 'desc' }, take: 10 });
  });

  it('skips a record of an action it does not know instead of showing it as something else', async () => {
    const { prisma } = prismaWith([record({ action: 'somethingFromTheFuture' }), record()]);

    expect(await createPrismaActivityLog(prisma).list({ limit: 10 })).toHaveLength(1);
  });

  it('survives damaged subjects and details', async () => {
    const { prisma } = prismaWith([record({ subjects: null, details: null })]);

    expect((await createPrismaActivityLog(prisma).list({ limit: 10 }))[0]).toMatchObject({ subjects: [], details: {} });
  });
});
