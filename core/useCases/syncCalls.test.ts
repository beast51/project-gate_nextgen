import { describe, expect, it, vi } from 'vitest';
import { Call, IncomingCall } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createGetCalls } from './getCalls';
import { createRefreshCalls, createSyncCalls, DEFAULT_SYNC_INTERVAL_SECONDS } from './syncCalls';

const resident: GateUser = {
  id: 'gate-user-id',
  externalId: '777',
  name: 'Ivan',
  phoneNumber: '380501111111',
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  image: 'ivan.png',
  additionalImages: [],
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
};

const gateUsersWith = (...users: GateUser[]): GateUsersRepository => ({
  list: async () => users,
  listBlackListed: async () => [],
  findByPhoneNumber: async (phoneNumber) => users.find(user => user.phoneNumber === phoneNumber) ?? null,
  addMissing: async () => {},
  update: async () => {},
  remove: async () => {},
});

const storedCall = (number: string, time: string): Call => ({
  number,
  time,
  carNumber: [],
  callerName: 'Ivan',
  apartmentNumber: '12',
  image: null,
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
  secondsFullTime: 5,
  cause: 17,
  state: 'BUSY',
});

describe('syncCalls', () => {
  const incoming: IncomingCall[] = [
    { number: '380501111111', time: '2024-03-10 09:00:00', secondsFullTime: 4, cause: 17, state: 'BUSY' },
    { number: '380501111111', time: '2024-03-10 10:00:00', secondsFullTime: 5, cause: 17, state: 'BUSY' },
    { number: '380509999999', time: '2024-03-10 10:05:00', secondsFullTime: 3, cause: 31, state: 'NOANSWER' },
  ];

  it('stores only calls newer than the last stored one, with a snapshot of the caller', async () => {
    const { repository, state } = createFakeCallsRepository([storedCall('380501111111', '2024-03-10 09:00:00')]);

    await createSyncCalls({
      source: { getCalls: async () => incoming },
      calls: repository,
      gateUsers: gateUsersWith(resident),
    })('from', 'to');

    expect(state.calls.slice(1)).toEqual([
      {
        number: '380501111111',
        time: '2024-03-10 10:00:00',
        callerName: 'Ivan',
        carNumber: ['AA1111AA'],
        apartmentNumber: '12',
        image: 'ivan.png',
        isBlackListed: false,
        blackListedFrom: '',
        blackListedTo: '',
        secondsFullTime: 5,
        cause: 17,
        state: 'BUSY',
      },
      {
        number: '380509999999',
        time: '2024-03-10 10:05:00',
        callerName: 'Not registered',
        carNumber: undefined,
        apartmentNumber: undefined,
        image: undefined,
        isBlackListed: false,
        blackListedFrom: '',
        blackListedTo: '',
        secondsFullTime: 3,
        cause: 31,
        state: 'NOANSWER',
      },
    ]);
    expect(state.links).toEqual(['gate-user-id', undefined]);
  });

  it('does not duplicate calls when it runs twice', async () => {
    const { repository, state } = createFakeCallsRepository();
    const syncCalls = createSyncCalls({
      source: { getCalls: async () => incoming },
      calls: repository,
      gateUsers: gateUsersWith(resident),
    });

    await syncCalls('from', 'to');
    await syncCalls('from', 'to');

    expect(state.calls).toHaveLength(3);
  });
});

describe('refreshCalls (rate limit guard of the telephony)', () => {
  const at = (iso: string) => () => new Date(iso);

  it('goes to the telephony not more often than once per 5 seconds by default', async () => {
    expect(DEFAULT_SYNC_INTERVAL_SECONDS).toBe(5);

    const { repository } = createFakeCallsRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const syncCalls = vi.fn(async () => {});

    await createRefreshCalls({ calls: repository, syncCalls, now: at('2024-03-10T12:00:03.000Z') })('from', 'to');
    await createRefreshCalls({ calls: repository, syncCalls, now: at('2024-03-10T12:00:05.000Z') })('from', 'to');
    expect(syncCalls).not.toHaveBeenCalled();

    await createRefreshCalls({ calls: repository, syncCalls, now: at('2024-03-10T12:00:05.001Z') })('from', 'to');
    expect(syncCalls).toHaveBeenCalledTimes(1);
    expect(syncCalls).toHaveBeenCalledWith('from', 'to');
  });

  it('lets only one of several simultaneous requests through', async () => {
    const { repository } = createFakeCallsRepository();
    const syncCalls = vi.fn(async () => {});
    const refreshCalls = createRefreshCalls({ calls: repository, syncCalls, now: at('2024-03-10T12:00:00.000Z') });

    await Promise.all([refreshCalls('from', 'to'), refreshCalls('from', 'to'), refreshCalls('from', 'to')]);

    expect(syncCalls).toHaveBeenCalledTimes(1);
  });

  it('keeps the limit when the synchronization fails', async () => {
    const { repository } = createFakeCallsRepository();
    const syncCalls = vi.fn(async () => { throw new Error('telephony is down'); });
    const refreshCalls = createRefreshCalls({ calls: repository, syncCalls, now: at('2024-03-10T12:00:00.000Z') });

    await expect(refreshCalls('from', 'to')).rejects.toThrow('telephony is down');
    await refreshCalls('from', 'to');

    expect(syncCalls).toHaveBeenCalledTimes(1);
  });

  it('uses the interval of the tenant', async () => {
    const { repository } = createFakeCallsRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const syncCalls = vi.fn(async () => {});

    await createRefreshCalls({
      calls: repository, syncCalls, minIntervalSeconds: 60, now: at('2024-03-10T12:00:30.000Z'),
    })('from', 'to');

    expect(syncCalls).not.toHaveBeenCalled();
  });
});

describe('getCalls', () => {
  it('returns the calls of the period, the newest first', async () => {
    const { repository } = createFakeCallsRepository([
      storedCall('1', '2024-03-10 09:00:00'),
      storedCall('2', '2024-03-10 11:00:00'),
      storedCall('3', '2024-03-10 10:00:00'),
      storedCall('4', '2024-03-11 10:00:00'),
    ]);

    const calls = await createGetCalls({ calls: repository, refreshCalls: async () => {} })(
      '2024-03-10 00:00:00',
      '2024-03-10 23:59:59',
    );

    expect(calls.map(call => call.number)).toEqual(['2', '3', '1']);
  });
});
