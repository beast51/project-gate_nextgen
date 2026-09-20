import { CallsRepository } from '../../ports/callsRepository';
import { GateUsersRepository } from '../../ports/gateUsersRepository';
import { generateDemoData } from './generateDemoData';

type Dependencies = {
  gateUsers: GateUsersRepository
  calls: CallsRepository
  // makes the data of different sandboxes different, usually the account id
  seed: string
  now?: () => Date
}

// Fills an empty sandbox with synthetic data. A sandbox that has any data is never touched,
// so the changes of a demo visitor survive. Returns true when the data was created.
export const createSeedDemoSandbox = ({ gateUsers, calls, seed, now = () => new Date() }: Dependencies) =>
  async (): Promise<boolean> => {
    if (await calls.findLast()) return false;
    if ((await gateUsers.list()).length > 0) return false;

    const data = generateDemoData(seed, now());

    await gateUsers.addMissing(data.gateUsers);

    const stored = await gateUsers.list();
    const idByPhoneNumber = new Map(stored.map(user => [user.phoneNumber, user.id]));

    await calls.addMany(data.calls.map(call => ({ call, gateUserId: idByPhoneNumber.get(call.number) })));

    return true;
  };
