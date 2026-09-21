import { GateUser } from '../entities/gateUser';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { RecordActivity } from './activity';

type Dependencies = {
  gateUsers: GateUsersRepository
  recordActivity: RecordActivity
}

export type ImportGateUsersResult = { received: number, added: number, skipped: number }

const isRestorable = (user: Partial<GateUser>): user is GateUser =>
  typeof user?.phoneNumber === 'string' && user.phoneNumber !== '' &&
  typeof user?.name === 'string' &&
  typeof user?.externalId === 'string' &&
  Array.isArray(user?.carNumber);

// Restores gate users from a backup made by the export (the list of all gate users).
// Only the storage is restored: the telephony directory is not touched, stored users are not overwritten.
export const createImportGateUsers = ({ gateUsers, recordActivity }: Dependencies) =>
  async (backup: Partial<GateUser>[]): Promise<ImportGateUsersResult> => {
    if (!Array.isArray(backup)) {
      throw new Error('A backup must be a list of gate users');
    }

    const broken = backup.findIndex(user => !isRestorable(user));
    if (broken !== -1) {
      // nothing is imported from a damaged file
      throw new Error(`Record ${broken} of the backup is not a gate user`);
    }

    const users = (backup as GateUser[]).map(({ id, ...user }) => ({
      ...user,
      apartmentNumber: user.apartmentNumber ?? null,
      isBlackListed: Boolean(user.isBlackListed),
      blackListedFrom: user.blackListedFrom || '',
      blackListedTo: user.blackListedTo || '',
    }));

    const added = await gateUsers.addMissing(users);

    const result = { received: users.length, added, skipped: users.length - added };

    await recordActivity('gateUsersImported', [], result);

    return result;
  };
