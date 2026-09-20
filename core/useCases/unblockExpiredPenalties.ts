import moment from 'moment';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// A penalty is over when more than a minute has passed since its end
export const isPenaltyExpired = (blackListedTo: string | undefined | null, now: Date = new Date()) => {
  if (!blackListedTo) return false;

  const currentTime = moment(moment(now).format(TIME_FORMAT), TIME_FORMAT);
  return currentTime.diff(moment(blackListedTo, TIME_FORMAT), 'minutes') > 1;
};

type Dependencies = {
  directory: GateUsersDirectory
  gateUsers: GateUsersRepository
}

// Returns phone numbers of the users whose penalty has expired and who may open the gate again
export const createUnblockExpiredPenalties = ({ directory, gateUsers }: Dependencies) =>
  async (now: Date = new Date()): Promise<string[]> => {
    const blackListed = await gateUsers.listBlackListed();
    const expired = blackListed.filter(user => isPenaltyExpired(user.blackListedTo, now));
    const unblocked: string[] = [];

    for (const user of expired) {
      try {
        await directory.update({
          externalId: user.externalId,
          name: user.name || '',
          phoneNumber: user.phoneNumber,
          carNumber: user.carNumber,
          apartmentNumber: user.apartmentNumber || '',
          isBlackListed: false,
        });

        await gateUsers.update({
          externalId: user.externalId,
          name: user.name || undefined,
          phoneNumber: user.phoneNumber,
          carNumber: user.carNumber,
          apartmentNumber: user.apartmentNumber || undefined,
          isBlackListed: false,
          blackListedFrom: user.blackListedFrom,
          blackListedTo: user.blackListedTo,
          image: user.image || undefined,
        });

        unblocked.push(user.phoneNumber);
      } catch (error) {
        // one failed user must not stop the others, the next run will retry
        console.error(`Failed to unblock ${user.phoneNumber}`, error);
      }
    }

    return unblocked;
  };
