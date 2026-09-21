import { PrismaClient } from '@prisma/client';
import { Account } from '@/core/entities/account';
import { AccountsRepository } from '@/core/ports/accountsRepository';

const accountFields = { id: true, name: true, tenant: true, role: true, sandboxLastUsedAt: true } as const;

type AccountRecord = Omit<Account, 'role'> & { role: string | null }

// an unknown role gives no rights
const toAccount = (record: AccountRecord): Account => ({ ...record, role: record.role === 'admin' ? 'admin' : null });

export const createPrismaAccountsRepository = (prisma: PrismaClient): AccountsRepository => ({
  findById: async (id) => {
    const record = await prisma.user.findUnique({ where: { id }, select: accountFields });
    return record && toAccount(record);
  },

  markSandboxUsed: async (id, now) => {
    await prisma.user.update({ where: { id }, data: { sandboxLastUsedAt: now } });
  },

  listIdleSandboxOwners: async (usedBefore) => {
    const records = await prisma.user.findMany({
      where: { sandboxLastUsedAt: { lt: usedBefore } },
      select: accountFields,
    });
    return records.map(toAccount);
  },

  markSandboxRemoved: async (id) => {
    await prisma.user.update({ where: { id }, data: { sandboxLastUsedAt: null } });
  },
});
