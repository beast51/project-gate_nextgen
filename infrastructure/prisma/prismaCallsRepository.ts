import { PrismaClient } from '@prisma/client';
import { Call, CALL_OUTCOMES, CallOutcome, PassageCall } from '@/core/entities/call';
import { CallsRepository } from '@/core/ports/callsRepository';

const callFields = {
  number: true,
  time: true,
  callerName: true,
  carNumber: true,
  apartmentNumber: true,
  image: true,
  isBlackListed: true,
  blackListedFrom: true,
  blackListedTo: true,
  secondsFullTime: true,
  outcome: true,
  cause: true,
  state: true,
} as const;

// what the rules of violations read; months of calls are loaded with it, so nothing extra
const passageFields = {
  number: true,
  time: true,
  callerName: true,
  apartmentNumber: true,
  isBlackListed: true,
  secondsFullTime: true,
  outcome: true,
  cause: true,
  state: true,
} as const;

type RawCodes = { cause: number | null, state: string | null, secondsFullTime: number | null }

type StoredPassage = Omit<PassageCall, 'outcome' | 'carNumber' | 'image'> & { outcome: string | null } & RawCodes

type StoredCall = Omit<Call, 'outcome'> & { outcome: string | null }

export type PrismaCallsRepositoryConfig = {
  // A call keeps the raw codes of the telephony provider of this database next to its outcome. When the codes are
  // there, they win: the rule that reads them may be corrected, and the history must follow. The storage does not
  // know providers, so the translation comes from the provider adapter. Without it (a demo) the stored outcome is used.
  outcomeOfRawCodes?: (raw: RawCodes) => CallOutcome
}

const isCallOutcome = (value: string | null): value is CallOutcome =>
  value !== null && (CALL_OUTCOMES as readonly string[]).includes(value);

export const createPrismaCallsRepository = (
  prisma: PrismaClient,
  { outcomeOfRawCodes }: PrismaCallsRepositoryConfig = {},
): CallsRepository => {
  const outcomeOf = ({ outcome, cause, state, secondsFullTime }: { outcome: string | null } & RawCodes): CallOutcome => {
    const hasRawCodes = cause !== null || state !== null;

    if (outcomeOfRawCodes && hasRawCodes) return outcomeOfRawCodes({ cause, state, secondsFullTime });

    return isCallOutcome(outcome) ? outcome : 'unknown';
  };

  const toCall = (record: StoredCall): Call => ({ ...record, outcome: outcomeOf(record) });

  const toPassage = ({ cause, state, secondsFullTime, outcome, ...passage }: StoredPassage): PassageCall => ({
    ...passage,
    outcome: outcomeOf({ outcome, cause, state, secondsFullTime }),
  });

  return {
    findByTimeRange: async (from, to) => {
      try {
        const records = await prisma.call.findMany({
          where: { time: { gte: from, lte: to } },
          select: callFields,
        });
        return records.map(toCall);
      } catch (error) {
        console.error(error);
        throw new Error('Error receiving data from Call');
      }
    },

    findPassagesByTimeRange: async (from, to) => {
      const records = await prisma.call.findMany({
        where: { time: { gte: from, lte: to } },
        select: passageFields,
      });

      return records.map(toPassage);
    },

    findPassagesOfSubject: async (subjectKey, from, to) => {
      const records = await prisma.call.findMany({
        where: { time: { gte: from, lte: to }, OR: [{ apartmentNumber: subjectKey }, { number: subjectKey }] },
        select: passageFields,
      });

      return records
        // a phone number is the key only for a caller without an apartment
        .filter(record => (record.apartmentNumber || record.number) === subjectKey)
        .map(toPassage);
    },

    findPenaltySnapshots: async (since) => {
      const records = await prisma.call.findMany({
        where: { isBlackListed: true, blackListedFrom: { gte: since } },
        select: { number: true, apartmentNumber: true, blackListedFrom: true, blackListedTo: true },
      });

      return records.map(record => ({
        ...record,
        blackListedFrom: record.blackListedFrom ?? '',
        blackListedTo: record.blackListedTo ?? '',
      }));
    },

    findLast: async () => {
      try {
        const record = await prisma.call.findFirst({ orderBy: { time: 'desc' }, select: callFields });
        return record && toCall(record);
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    addMany: async (calls) => {
      if (calls.length === 0) return;

      await prisma.call.createMany({
        data: calls.map(({ call, gateUserId }) => ({ ...call, gateUserId })),
      });
    },

    listFilledDays: async (fromDay, toDay) => {
      const days = await prisma.callsDaySync.findMany({
        where: { id: { gte: fromDay, lte: toDay } },
        select: { id: true },
      });
      return days.map(day => day.id);
    },

    markDaysFilled: async (days, at) => {
      // the day is the id, so marking twice (two requests at once) is harmless
      await Promise.all(days.map(day => prisma.callsDaySync.upsert({
        where: { id: day },
        create: { id: day, syncedAt: at },
        update: { syncedAt: at },
      })));
    },

    // The time is stored as an ISO string in UTC, ISO strings are compared lexicographically.
    // A database has one LastCallsRequestFromApi document; values in the old local-time format count as expired.
    claimSync: async (now, minIntervalSeconds) => {
      const threshold = new Date(now.getTime() - minIntervalSeconds * 1000).toISOString();

      try {
        // a conditional update is atomic: of several concurrent requests only one matches the filter
        const claimed = await prisma.lastCallsRequestFromApi.updateMany({
          where: {
            OR: [
              { time: { lt: threshold } },
              { NOT: { time: { contains: 'T' } } },
            ],
          },
          data: { time: now.toISOString() },
        });

        if (claimed.count > 0) return true;

        // an empty database (a new tenant): the first request creates the record and takes the slot
        if (await prisma.lastCallsRequestFromApi.count() === 0) {
          await prisma.lastCallsRequestFromApi.create({ data: { time: now.toISOString() } });
          return true;
        }

        return false;
      } catch (error) {
        // when in doubt, protect the telephony limit
        console.error('failed to claim the calls synchronization slot', error);
        return false;
      }
    },

    extendSync: async (now) => {
      await prisma.lastCallsRequestFromApi.updateMany({ data: { time: now.toISOString() } });
    },
  };
};
