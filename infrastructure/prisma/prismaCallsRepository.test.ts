import { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createPrismaCallsRepository } from './prismaCallsRepository';

type Where = { OR: [{ time: { lt: string } }, { NOT: { time: { contains: string } } }] }

// Emulates the single LastCallsRequestFromApi collection with the filter operators the adapter uses
const createPrismaStub = (records: { time: string }[]) => {
  const matches = (record: { time: string }, where: Where) =>
    record.time < where.OR[0].time.lt || !record.time.includes(where.OR[1].NOT.time.contains);

  const lastCallsRequestFromApi = {
    updateMany: vi.fn(async ({ where, data }: { where?: Where, data: { time: string } }) => {
      const matched = records.filter(record => !where || matches(record, where));
      matched.forEach(record => { record.time = data.time; });
      return { count: matched.length };
    }),
    count: vi.fn(async () => records.length),
    create: vi.fn(async ({ data }: { data: { time: string } }) => { records.push(data); return data; }),
  };

  return { prisma: { lastCallsRequestFromApi } as unknown as PrismaClient, lastCallsRequestFromApi, records };
};

const NOW = new Date('2024-03-10T12:00:00.000Z');

describe('prismaCallsRepository.claimSync', () => {
  it('refuses inside the interval and stores nothing', async () => {
    const { prisma, records } = createPrismaStub([{ time: '2024-03-10T11:59:57.000Z' }]);

    expect(await createPrismaCallsRepository(prisma).claimSync(NOW, 5)).toBe(false);
    expect(records).toEqual([{ time: '2024-03-10T11:59:57.000Z' }]);
  });

  it('claims the slot after the interval and stores the time in UTC', async () => {
    const { prisma, records } = createPrismaStub([{ time: '2024-03-10T11:59:54.999Z' }]);

    expect(await createPrismaCallsRepository(prisma).claimSync(NOW, 5)).toBe(true);
    expect(records).toEqual([{ time: '2024-03-10T12:00:00.000Z' }]);
  });

  it('claims only once for simultaneous requests', async () => {
    const { prisma } = createPrismaStub([{ time: '2024-03-10T11:00:00.000Z' }]);
    const repository = createPrismaCallsRepository(prisma);

    const results = await Promise.all([repository.claimSync(NOW, 5), repository.claimSync(NOW, 5), repository.claimSync(NOW, 5)]);

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  // before the fix the time was stored as Moscow local time, it could even be "in the future" for a UTC server
  it('treats a value in the old local-time format as expired', async () => {
    const { prisma, records } = createPrismaStub([{ time: '2024-03-10 15:00:00' }]);

    expect(await createPrismaCallsRepository(prisma).claimSync(NOW, 5)).toBe(true);
    expect(records[0].time).toBe('2024-03-10T12:00:00.000Z');
  });

  it('creates the record in an empty database and claims the slot', async () => {
    const { prisma, records } = createPrismaStub([]);

    expect(await createPrismaCallsRepository(prisma).claimSync(NOW, 5)).toBe(true);
    expect(records).toEqual([{ time: '2024-03-10T12:00:00.000Z' }]);
  });

  it('restarts the interval for the owner of the slot, so nobody starts while it is writing', async () => {
    const { prisma } = createPrismaStub([{ time: '2024-03-10T11:00:00.000Z' }]);
    const repository = createPrismaCallsRepository(prisma);

    expect(await repository.claimSync(NOW, 5)).toBe(true);
    const sixSecondsLater = new Date(NOW.getTime() + 6000);
    await repository.extendSync(sixSecondsLater);

    expect(await repository.claimSync(new Date(sixSecondsLater.getTime() + 1000), 5)).toBe(false);
  });

  it('protects the telephony when the storage fails', async () => {
    const { prisma, lastCallsRequestFromApi } = createPrismaStub([]);
    lastCallsRequestFromApi.updateMany.mockRejectedValueOnce(new Error('db is down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await createPrismaCallsRepository(prisma).claimSync(NOW, 5)).toBe(false);
  });
});

describe('prismaCallsRepository outcomes', () => {
  const record = (overrides: Record<string, unknown>) => ({
    number: '380501111111', time: '2024-03-10 10:00:00', callerName: 'Ivan', carNumber: [], apartmentNumber: '12',
    image: null, isBlackListed: false, blackListedFrom: '', blackListedTo: '', secondsFullTime: 5,
    outcome: null, cause: null, state: null, ...overrides,
  });

  const prismaWith = (records: unknown[]) =>
    ({ call: { findMany: vi.fn(async () => records) } }) as unknown as PrismaClient;

  // the rule that reads the codes of the provider may be corrected, and the history has to follow
  it('lets the raw codes of the provider win over the stored outcome', async () => {
    const outcomeOfRawCodes = vi.fn(({ cause }: { cause: number | null }) => (cause === 17 ? 'opened' as const : 'notOpened' as const));
    const repository = createPrismaCallsRepository(prismaWith([
      record({ outcome: 'openedAfterLongWait', cause: 16, state: 'NOANSWER', secondsFullTime: 0 }),
      record({ outcome: null, cause: 17, state: 'BUSY', secondsFullTime: 4 }),
    ]), { outcomeOfRawCodes });

    expect((await repository.findByTimeRange('a', 'b')).map(call => call.outcome)).toEqual(['notOpened', 'opened']);
    expect(outcomeOfRawCodes).toHaveBeenCalledWith({ cause: 16, state: 'NOANSWER', secondsFullTime: 0 });
    expect((await repository.findPassagesByTimeRange('a', 'b')).map(call => call.outcome)).toEqual(['notOpened', 'opened']);
  });

  // a demo has no provider: its calls carry only the outcome
  it('reads the stored outcome of a call without raw codes', async () => {
    const withProvider = createPrismaCallsRepository(prismaWith([record({ outcome: 'operatorError' })]), { outcomeOfRawCodes: () => 'opened' });
    const demo = createPrismaCallsRepository(prismaWith([record({ outcome: 'openedAfterLongWait', cause: 17 })]));

    expect((await withProvider.findByTimeRange('a', 'b'))[0].outcome).toBe('operatorError');
    expect((await demo.findByTimeRange('a', 'b'))[0].outcome).toBe('openedAfterLongWait');
  });

  it('does not trust an outcome it does not know', async () => {
    const repository = createPrismaCallsRepository(prismaWith([record({ outcome: 'something new' })]));

    expect((await repository.findByTimeRange('a', 'b'))[0].outcome).toBe('unknown');
  });
});
