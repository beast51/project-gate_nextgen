import { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createPrismaAccessLog } from './prismaAccessLog';

const prismaStub = (records: unknown[] = []) => {
  const stub = {
    $runCommandRaw: vi.fn(async () => ({ ok: 1 })),
    accessEvent: { create: vi.fn(async () => ({})), findMany: vi.fn(async () => records) },
  };
  return { prisma: stub as unknown as PrismaClient, stub };
};

const event = {
  at: '2024-03-10T12:00:00.000Z', actor: { id: 'account-7', name: 'Yuriy' }, kind: 'pageView' as const,
  path: '/calls', ip: '203.0.113.7', device: 'Chrome · Windows',
};

describe('prismaAccessLog', () => {
  it('asks MongoDB to remove records after 30 days, once per database', async () => {
    const { prisma, stub } = prismaStub();
    const log = createPrismaAccessLog(prisma);

    await log.record(event);
    await log.record(event);

    expect(stub.$runCommandRaw).toHaveBeenCalledTimes(1);
    expect(stub.$runCommandRaw).toHaveBeenCalledWith({
      createIndexes: 'AccessEvent',
      indexes: [{ key: { at: 1 }, name: 'AccessEvent_retention', expireAfterSeconds: 30 * 24 * 60 * 60 }],
    });
    // expiring works only on a date field
    expect(stub.accessEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ at: new Date(event.at), actorId: 'account-7' }) });
  });

  it('keeps recording when the index can not be created', async () => {
    const { prisma, stub } = prismaStub();
    stub.$runCommandRaw.mockRejectedValueOnce(new Error('not allowed'));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    await createPrismaAccessLog(prisma).record(event);

    expect(stub.accessEvent.create).toHaveBeenCalledTimes(1);
    errors.mockRestore();
  });

  it('reads the newest records of an account and skips kinds it does not know', async () => {
    const stored = { id: '1', at: new Date(event.at), actorId: 'account-7', actorName: 'Yuriy', kind: 'pageView', path: '/calls', ip: '203.0.113.7', device: null };
    const { prisma, stub } = prismaStub([stored, { ...stored, id: '2', kind: 'somethingNew' }]);

    const events = await createPrismaAccessLog(prisma).list({ limit: 30, actorId: 'account-7' });

    expect(stub.accessEvent.findMany).toHaveBeenCalledWith({ where: { actorId: 'account-7' }, orderBy: { id: 'desc' }, take: 30 });
    expect(events).toEqual([{ id: '1', at: event.at, actor: { id: 'account-7', name: 'Yuriy' }, kind: 'pageView', path: '/calls', ip: '203.0.113.7', device: null }]);
  });

  it('asks for the records of a period by real dates', async () => {
    const { prisma, stub } = prismaStub();

    await createPrismaAccessLog(prisma).list({
      limit: 200, period: { from: '2024-03-09T22:00:00.000Z', to: '2024-03-10T21:59:59.999Z' },
    });

    expect(stub.accessEvent.findMany).toHaveBeenCalledWith({
      where: { at: { gte: new Date('2024-03-09T22:00:00.000Z'), lte: new Date('2024-03-10T21:59:59.999Z') } },
      orderBy: { id: 'desc' },
      take: 200,
    });
  });
});
