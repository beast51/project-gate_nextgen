import { describe, expect, it, vi } from 'vitest';
import { Call, IncomingCall } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createGetCalls } from './getCalls';
import { createRefreshCalls, createSyncCalls, isTimeToSyncCalls } from './syncCalls';

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

describe('isTimeToSyncCalls', () => {
  it('is time when more than the interval has passed', () => {
    expect(isTimeToSyncCalls('2024-03-10 12:00:00', '2024-03-10 12:00:11')).toBe(true);
  });

  it('is not time inside the interval', () => {
    expect(isTimeToSyncCalls('2024-03-10 12:00:00', '2024-03-10 12:00:10')).toBe(false);
    expect(isTimeToSyncCalls('2024-03-10 12:00:00', '2024-03-10 12:00:01')).toBe(false);
  });

  // historical behaviour: a zero or negative difference (clock in another time zone) means "sync"
  it('is time when the stored time is not earlier than the current time', () => {
    expect(isTimeToSyncCalls('2024-03-10 12:00:00', '2024-03-10 12:00:00')).toBe(true);
    expect(isTimeToSyncCalls('2024-03-10 15:00:00', '2024-03-10 12:00:00')).toBe(true);
  });

  it('is not time when the last sync time is unknown', () => {
    expect(isTimeToSyncCalls(null, '2024-03-10 12:00:00')).toBe(false);
  });
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
      currentSyncTime: () => '2024-03-10 13:00:00',
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
    expect(state.lastSyncTime).toBe('2024-03-10 13:00:00');
  });

  it('does not duplicate calls when it runs twice', async () => {
    const { repository, state } = createFakeCallsRepository();
    const syncCalls = createSyncCalls({
      source: { getCalls: async () => incoming },
      calls: repository,
      gateUsers: gateUsersWith(resident),
      currentSyncTime: () => '2024-03-10 13:00:00',
    });

    await syncCalls('from', 'to');
    await syncCalls('from', 'to');

    expect(state.calls).toHaveLength(3);
  });
});

describe('refreshCalls', () => {
  it('synchronizes only when the interval has passed', async () => {
    const { repository } = createFakeCallsRepository([], '2024-03-10 12:00:00');
    const syncCalls = vi.fn(async () => {});

    await createRefreshCalls({ calls: repository, syncCalls, currentTime: () => '2024-03-10 12:00:05' })('from', 'to');
    expect(syncCalls).not.toHaveBeenCalled();

    await createRefreshCalls({ calls: repository, syncCalls, currentTime: () => '2024-03-10 12:00:30' })('from', 'to');
    expect(syncCalls).toHaveBeenCalledWith('from', 'to');
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
