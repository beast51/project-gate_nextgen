import { PrismaClient } from '@prisma/client';
import { UNREGISTERED_CALLER_NAME } from '@/core/entities/call';
import { CallsRepository } from '@/core/ports/callsRepository';

export type PrismaCallsRepositoryConfig = {
  // id of the single LastCallsRequestFromApi document of this database
  lastSyncRecordId: string
}

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

export const createPrismaCallsRepository = (
  prisma: PrismaClient,
  config: PrismaCallsRepositoryConfig,
): CallsRepository => ({
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

  exists: async (number, time) => {
    try {
      const call = await prisma.call.findFirst({ where: { number, time }, select: { id: true } });
      return Boolean(call);
    } catch (error) {
      console.error(error);
      return false;
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

  getLastSyncTime: async () => {
    try {
      const record = await prisma.lastCallsRequestFromApi.findFirst({ select: { time: true } });
      return record && record.time;
    } catch (error) {
      console.error('failed to receive time of last update calls', error);
      return null;
    }
  },

  setLastSyncTime: async (time) => {
    try {
      await prisma.lastCallsRequestFromApi.update({
        where: { id: config.lastSyncRecordId },
        data: { time },
      });
    } catch (error) {
      console.error(error);
    }
  },
});
