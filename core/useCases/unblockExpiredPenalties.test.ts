import { noActivity } from './__fixtures__/fakeActivityLog';
import { describe, expect, it, vi } from 'vitest';
import { GateUser } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { createUnblockExpiredPenalties, isPenaltyExpired } from './unblockExpiredPenalties';

const NOW = new Date('2024-03-10 12:00:00');

const blackListed = (phoneNumber: string, blackListedTo: string): GateUser => ({
  id: `id-${phoneNumber}`,
  externalId: `ext-${phoneNumber}`,
  name: 'Ivan',
  phoneNumber,
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  image: null,
  additionalImages: [],
  isBlackListed: true,
  blackListedFrom: '2024-03-03 12:00:00',
  blackListedTo,
});

const createFakes = (users: GateUser[]) => {
  const directory: GateUsersDirectory = {
    find: vi.fn(async () => []),
    add: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  };
  const gateUsers: GateUsersRepository = {
    list: vi.fn(async () => users),
    listBlackListed: vi.fn(async () => users),
    findByPhoneNumbers: vi.fn(async () => []),
    addMissing: vi.fn(async () => 0),
    update: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    claimDirectorySync: vi.fn(async () => true),
  };
  return { directory, gateUsers };
};

describe('isPenaltyExpired', () => {
  it('expires when more than a minute has passed since the end of the penalty', () => {
    expect(isPenaltyExpired('2024-03-10 11:58:00', NOW)).toBe(true);
    expect(isPenaltyExpired('2024-03-10 11:59:00', NOW)).toBe(false);
    expect(isPenaltyExpired('2024-03-10 13:00:00', NOW)).toBe(false);
  });

  it('does not expire without an end date', () => {
    expect(isPenaltyExpired('', NOW)).toBe(false);
    expect(isPenaltyExpired(undefined, NOW)).toBe(false);
  });
});

describe('unblockExpiredPenalties', () => {
  it('lets only users with an expired penalty open the gate again', async () => {
    const { directory, gateUsers } = createFakes([
      blackListed('380501111111', '2024-03-10 10:00:00'),
      blackListed('380502222222', '2024-03-12 10:00:00'),
    ]);

    const unblocked = await createUnblockExpiredPenalties({ directory, gateUsers, recordActivity: noActivity })(NOW);

    expect(unblocked).toEqual(['380501111111']);
    expect(directory.update).toHaveBeenCalledTimes(1);
    expect(directory.update).toHaveBeenCalledWith({
      externalId: 'ext-380501111111',
      name: 'Ivan',
      phoneNumber: '380501111111',
      carNumber: ['AA1111AA'],
      apartmentNumber: '12',
      isBlackListed: false,
    });
    expect(gateUsers.update).toHaveBeenCalledWith(expect.objectContaining({
      phoneNumber: '380501111111',
      isBlackListed: false,
      blackListedTo: '2024-03-10 10:00:00',
    }));
  });

  it('keeps going when one user fails and does not report it as unblocked', async () => {
    const { directory, gateUsers } = createFakes([
      blackListed('380501111111', '2024-03-10 10:00:00'),
      blackListed('380502222222', '2024-03-10 10:00:00'),
    ]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    directory.update = vi.fn()
      .mockRejectedValueOnce(new Error('telephony is down'))
      .mockResolvedValueOnce(undefined);

    const unblocked = await createUnblockExpiredPenalties({ directory, gateUsers, recordActivity: noActivity })(NOW);

    expect(unblocked).toEqual(['380502222222']);
    expect(gateUsers.update).toHaveBeenCalledTimes(1);
  });
});
