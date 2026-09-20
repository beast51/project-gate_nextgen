import { PrismaClient } from '@prisma/client';
import { UNREGISTERED_CALLER_NAME } from '@/core/entities/call';
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
  cause: true,
  state: true,
} as const;

export const createPrismaCallsRepository = (prisma: PrismaClient): CallsRepository => ({
  findByTimeRange: async (from, to) => {
    try {
      return await prisma.call.findMany({
        where: { time: { gte: from, lte: to } },
        select: callFields,
      });
    } catch (error) {
      console.error(error);
      throw new Error('Error receiving data from Call');
    }
  },

  findGatePassagesByTimeRange: async (from, to, failedCauses) => {
    try {
      return await prisma.call.findMany({
        where: {
          time: { gte: from, lte: to },
          callerName: { not: UNREGISTERED_CALLER_NAME },
          isBlackListed: false,
          OR: [
            { cause: { not: { in: [...failedCauses] } } },
            { cause: { isSet: false } },
          ],
        },
        select: callFields,
      });
    } catch (error) {
      console.error(error);
      throw new Error('Error receiving data from Call');
    }
  },

  findLast: async () => {
    try {
      return await prisma.call.findFirst({ orderBy: { time: 'desc' }, select: callFields });
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  add: async (call, gateUserId) => {
    try {
      await prisma.call.create({
        data: {
          ...call,
          gateUser: gateUserId ? { connect: { id: gateUserId } } : undefined,
        },
      });
    } catch (error) {
      console.error(error);
    }
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
});
