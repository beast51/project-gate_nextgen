import { NewGateUser, parseCarNumbers } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { RecordActivity } from './activity';

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
  recordActivity: RecordActivity
}

// The telephony is the source of truth for the gate: the person is registered there first,
// then stored together with the id the telephony has assigned.
export const createAddGateUser = ({ directory, gateUsers, recordActivity }: Dependencies) =>
  async (newUser: NewGateUser): Promise<void> => {
    await directory.add(newUser);

    const [entry] = await directory.find({ phoneNumber: newUser.phoneNumber });

    if (!entry) {
      throw new Error(`Gate user ${newUser.phoneNumber} was not found in the directory after adding`);
    }

    const user = {
      externalId: entry.externalId,
      name: newUser.name,
      phoneNumber: newUser.phoneNumber,
      carNumber: parseCarNumbers(newUser.carNumber),
      apartmentNumber: newUser.apartmentNumber,
      image: null,
      additionalImages: [],
      isBlackListed: false,
      blackListedFrom: '',
      blackListedTo: '',
    };

    await gateUsers.addMissing([user]);
    await recordActivity('gateUserAdded', [user]);
  };
