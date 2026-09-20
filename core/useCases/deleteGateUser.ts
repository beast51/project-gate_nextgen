import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
}

export const createDeleteGateUser = ({ directory, gateUsers }: Dependencies) =>
  async ({ phoneNumber, externalId }: { phoneNumber: string, externalId: string }): Promise<void> => {
    await gateUsers.remove(phoneNumber);
    await directory.remove(externalId);
  };
