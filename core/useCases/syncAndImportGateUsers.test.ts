import { noActivity } from './__fixtures__/fakeActivityLog';
import { describe, expect, it, vi } from 'vitest';
import { GateUser } from '../entities/gateUser';
import { DirectoryEntry, GateUsersDirectory } from '../ports/gateUsersDirectory';
import { createFakeGateUsersRepository } from './__fixtures__/fakeGateUsersRepository';
import { createImportGateUsers } from './importGateUsers';
import { createSyncGateUsers, DEFAULT_DIRECTORY_SYNC_INTERVAL_SECONDS } from './syncGateUsers';

const entry = (phoneNumber: string, overrides: Partial<DirectoryEntry> = {}): DirectoryEntry => ({
  externalId: `ext-${phoneNumber}`,
  name: 'Ivan',
  phoneNumber,
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  isBlackListed: false,
  ...overrides,
});

const stored = (phoneNumber: string, overrides: Partial<GateUser> = {}): GateUser => ({
  ...entry(phoneNumber),
  image: 'photo.png',
  additionalImages: ['car.png'],
  blackListedFrom: '',
  blackListedTo: '',
  ...overrides,
});

const directoryWith = (entries: DirectoryEntry[]): GateUsersDirectory => ({
  find: vi.fn(async () => entries),
  add: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
});

describe('syncGateUsers', () => {
  it('adds people known only to the directory and never overwrites stored users', async () => {
    const { repository, state } = createFakeGateUsersRepository([stored('380501111111', { name: 'Edited by operator' })]);
    const directory = directoryWith([entry('380501111111'), entry('380502222222', { isBlackListed: true })]);

    const result = await createSyncGateUsers({ directory, gateUsers: repository, recordActivity: noActivity })();

    expect(result).toEqual({ status: 'synced', found: 2, added: 1 });
    expect(state.users[0].name).toBe('Edited by operator');
    expect(state.users[1]).toEqual({
      ...entry('380502222222', { isBlackListed: true }),
      image: null,
      additionalImages: [],
      blackListedFrom: '',
      blackListedTo: '',
    });
  });

  it('stores the plates of the directory normalized: the telephony keeps them as they were typed', async () => {
    const { repository, state } = createFakeGateUsersRepository();
    const directory = directoryWith([entry('380501111111', { carNumber: ['вн 1096 іс', '  ВН9754НІ'] })]);

    await createSyncGateUsers({ directory, gateUsers: repository, recordActivity: noActivity })();

    expect(state.users[0].carNumber).toEqual(['BH1096IC', 'BH9754HI']);
  });

  it('downloads the directory not more often than once per 2 minutes', async () => {
    expect(DEFAULT_DIRECTORY_SYNC_INTERVAL_SECONDS).toBe(120);

    const { repository } = createFakeGateUsersRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const directory = directoryWith([]);

    const early = await createSyncGateUsers({
      directory, gateUsers: repository, recordActivity: noActivity, now: () => new Date('2024-03-10T12:01:59.000Z'),
    })();
    expect(early).toEqual({ status: 'skipped', reason: 'rate limit' });
    expect(directory.find).not.toHaveBeenCalled();

    const later = await createSyncGateUsers({
      directory, gateUsers: repository, recordActivity: noActivity, now: () => new Date('2024-03-10T12:02:01.000Z'),
    })();
    expect(later.status).toBe('synced');
  });

  it('lets only one of simultaneous synchronizations through', async () => {
    const { repository } = createFakeGateUsersRepository();
    const directory = directoryWith([entry('380501111111')]);
    const syncGateUsers = createSyncGateUsers({ directory, gateUsers: repository, recordActivity: noActivity });

    const results = await Promise.all([syncGateUsers(), syncGateUsers(), syncGateUsers()]);

    expect(results.filter(result => result.status === 'synced')).toHaveLength(1);
    expect(directory.find).toHaveBeenCalledTimes(1);
  });
});

describe('importGateUsers', () => {
  it('restores users with their images and penalties, skips the stored ones', async () => {
    const { repository, state } = createFakeGateUsersRepository([stored('380501111111', { name: 'Current' })]);
    const penalized = stored('380502222222', {
      id: 'old-database-id',
      isBlackListed: true,
      blackListedFrom: '2024-03-01 10:00:00',
      blackListedTo: '2024-03-08 10:00:00',
    });

    const result = await createImportGateUsers({ gateUsers: repository, recordActivity: noActivity })([stored('380501111111'), penalized]);

    expect(result).toEqual({ received: 2, added: 1, skipped: 1 });
    expect(state.users[0].name).toBe('Current');
    const { id, ...restored } = penalized;
    expect(state.users[1]).toEqual(restored);
  });

  it('imports nothing from a damaged backup', async () => {
    const { repository, state } = createFakeGateUsersRepository();
    const importGateUsers = createImportGateUsers({ gateUsers: repository, recordActivity: noActivity });

    await expect(importGateUsers([stored('380501111111'), { name: 'No phone' }])).rejects.toThrow('Record 1');
    await expect(importGateUsers({} as never)).rejects.toThrow('list of gate users');
    expect(state.users).toEqual([]);
  });
});
