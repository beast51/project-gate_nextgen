import { GateUser } from '../entities/gateUser';
import { DirectoryEntry, GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';

// The directory API is rate limited as well: a full download not more often than once per 2 minutes
export const DEFAULT_DIRECTORY_SYNC_INTERVAL_SECONDS = 120;

// The directory knows nothing about images and penalties
const toGateUser = (entry: DirectoryEntry): GateUser => ({
  ...entry,
  image: null,
  additionalImages: [],
  blackListedFrom: '',
  blackListedTo: '',
});

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
  minIntervalSeconds?: number
  now?: () => Date
}

export type SyncGateUsersResult =
  | { status: 'synced', found: number, added: number }
  | { status: 'skipped', reason: 'rate limit' }

// Brings people that exist only in the telephony directory into the storage: connecting a new customer
// whose contacts are already in the telephony, or contacts added there by hand. Stored users are never overwritten.
export const createSyncGateUsers = ({
  directory,
  gateUsers,
  minIntervalSeconds = DEFAULT_DIRECTORY_SYNC_INTERVAL_SECONDS,
  now = () => new Date(),
}: Dependencies) =>
  async (): Promise<SyncGateUsersResult> => {
    if (!await gateUsers.claimDirectorySync(now(), minIntervalSeconds)) {
      return { status: 'skipped', reason: 'rate limit' };
    }

    const entries = await directory.find();
    const added = await gateUsers.addMissing(entries.map(toGateUser));

    return { status: 'synced', found: entries.length, added };
  };
