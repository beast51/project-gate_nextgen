import { Account } from '../entities/account';

export type AccountsRepository = {
  findById: (id: string) => Promise<Account | null>
  markSandboxUsed: (id: string, now: Date) => Promise<void>
  // owners of sandboxes that were not used since the given moment
  listIdleSandboxOwners: (usedBefore: Date) => Promise<Account[]>
  markSandboxRemoved: (id: string) => Promise<void>
}
