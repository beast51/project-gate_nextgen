import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { RecordActivity } from './activity';

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
  recordActivity: RecordActivity
}

export const createDeleteGateUser = ({ directory, gateUsers, recordActivity }: Dependencies) =>
  async ({ phoneNumber, externalId }: { phoneNumber: string, externalId: string }): Promise<void> => {
    // read before removing: the journal keeps who it was
    const [removed] = await gateUsers.list({ phoneNumber });

    await gateUsers.remove(phoneNumber);
    await directory.remove(externalId);

    await recordActivity('gateUserRemoved', [removed ?? { phoneNumber, name: '', apartmentNumber: null, carNumber: [] }]);
  };
