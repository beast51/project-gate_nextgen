import { PrismaClient } from '@prisma/client';
import { AccountsRepository } from '@/core/ports/accountsRepository';

const accountFields = { id: true, name: true, tenant: true, sandboxLastUsedAt: true } as const;

export const createPrismaAccountsRepository = (prisma: PrismaClient): AccountsRepository => ({
  findById: (id) => prisma.user.findUnique({ where: { id }, select: accountFields }),

  markSandboxUsed: async (id, now) => {
    await prisma.user.update({ where: { id }, data: { sandboxLastUsedAt: now } });
  },

  listIdleSandboxOwners: (usedBefore) =>
    prisma.user.findMany({
      where: { sandboxLastUsedAt: { lt: usedBefore } },
      select: accountFields,
    }),

  markSandboxRemoved: async (id) => {
    await prisma.user.update({ where: { id }, data: { sandboxLastUsedAt: null } });
  },
});
