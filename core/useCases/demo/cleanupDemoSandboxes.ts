import { AccountsRepository } from '../../ports/accountsRepository';
import { SandboxStorage } from '../../ports/sandboxStorage';

export const DEFAULT_SANDBOX_MAX_IDLE_DAYS = 14;

type Dependencies = {
  accounts: AccountsRepository
  sandboxes: SandboxStorage
  maxIdleDays?: number
  now?: () => Date
}

// Removes personal demo databases nobody has used for a long time. The account stays:
// at the next sign in the visitor gets a fresh sandbox. Returns ids of the accounts whose sandboxes were removed.
export const createCleanupDemoSandboxes = ({
  accounts,
  sandboxes,
  maxIdleDays = DEFAULT_SANDBOX_MAX_IDLE_DAYS,
  now = () => new Date(),
}: Dependencies) =>
  async (): Promise<string[]> => {
    const usedBefore = new Date(now().getTime() - maxIdleDays * 24 * 60 * 60 * 1000);
    const removed: string[] = [];

    for (const owner of await accounts.listIdleSandboxOwners(usedBefore)) {
      // a sandbox exists only for accounts without a tenant, customer data must never be dropped from here
      if (owner.tenant) continue;

      try {
        await sandboxes.drop(owner.id);
        await accounts.markSandboxRemoved(owner.id);
        removed.push(owner.id);
      } catch (error) {
        console.error(`Failed to remove the sandbox of ${owner.id}`, error);
      }
    }

    return removed;
  };
