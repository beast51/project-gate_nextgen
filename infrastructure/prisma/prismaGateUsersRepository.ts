import { GateUser as GateUserRecord, PrismaClient } from '@prisma/client';
import { GateUser } from '@/core/entities/gateUser';
import { GateUsersRepository } from '@/core/ports/gateUsersRepository';

// the column keeps its historical name, the domain calls it externalId
const toGateUser = ({ idInApi, ...record }: GateUserRecord): GateUser => ({
  ...record,
  externalId: idInApi,
});

export const createPrismaGateUsersRepository = (prisma: PrismaClient): GateUsersRepository => ({
  list: async (filter = {}) => {
    try {
      const records = await prisma.gateUser.findMany({
        where: filter.phoneNumber ? { phoneNumber: filter.phoneNumber } : {},
      });
      return records.map(toGateUser);
    } catch (error) {
      console.error(error);
      throw new Error('Error receiving data from GateUser');
    }
  },

  listBlackListed: async () => {
    try {
      const records = await prisma.gateUser.findMany({
        where: { isBlackListed: true },
        orderBy: { apartmentNumber: 'asc' },
      });
      return records.map(toGateUser);
    } catch (error) {
      console.error(error);
      throw new Error('Error retrieving data from ViolationManagement');
    }
  },

  findByPhoneNumber: async (phoneNumber) => {
    try {
      const record = await prisma.gateUser.findUnique({ where: { phoneNumber } });
      return record ? toGateUser(record) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  addMissing: async (users) => {
    for (const user of users) {
      const existing = await prisma.gateUser.findFirst({
        where: { phoneNumber: user.phoneNumber },
      });

      if (existing) continue;

      await prisma.gateUser.create({
        data: {
          idInApi: user.externalId,
          name: user.name,
          phoneNumber: user.phoneNumber,
          carNumber: user.carNumber,
          apartmentNumber: user.apartmentNumber,
          isBlackListed: user.isBlackListed,
          blackListedFrom: '',
          blackListedTo: '',
        },
      });
    }
  },

  update: async ({ externalId, phoneNumber, ...changes }) => {
    await prisma.gateUser.update({
      where: { phoneNumber },
      data: { ...changes, phoneNumber, idInApi: externalId },
    });
  },

  remove: async (phoneNumber) => {
    try {
      await prisma.gateUser.delete({ where: { phoneNumber } });
    } catch (error) {
      console.error(error);
      throw new Error('Error while delete user');
    }
  },
});
