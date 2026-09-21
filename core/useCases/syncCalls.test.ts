import { describe, expect, it, vi } from 'vitest';
import { Call, IncomingCall } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createFakeGateUsersRepository } from './__fixtures__/fakeGateUsersRepository';
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

const gateUsersWith = (...users: GateUser[]) => createFakeGateUsersRepository(users).repository;

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
  outcome: 'opened',
  cause: 17,
  state: 'BUSY',
});

describe('syncCalls', () => {
  const incoming: IncomingCall[] = [
    { number: '380501111111', time: '2024-03-10 09:00:00', secondsFullTime: 4, outcome: 'opened', cause: 17, state: 'BUSY' },
    { number: '380501111111', time: '2024-03-10 10:00:00', secondsFullTime: 5, outcome: 'opened', cause: 17, state: 'BUSY' },
    { number: '380509999999', time: '2024-03-10 10:05:00', secondsFullTime: 3, outcome: 'connectionFailed', cause: 31, state: 'NOANSWER' },
  ];

  it('stores only calls that are not stored yet, with a snapshot of the caller', async () => {
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
        outcome: 'opened',
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
        outcome: 'connectionFailed',
        cause: 31,
        state: 'NOANSWER',
      },
    ]);
    expect(state.links).toEqual(['gate-user-id', undefined]);
  });

  // regression: nobody opened the application on the 19th, the 20th was synchronized first,
  // after that the calls of the 19th were dropped forever as "older than the newest stored call"
  it('fills in a missed day even when later calls are already stored', async () => {
    const { repository, state } = createFakeCallsRepository([storedCall('380501111111', '2024-03-11 08:00:00')]);

    await createSyncCalls({
      source: { getCalls: async () => incoming },
      calls: repository,
      gateUsers: gateUsersWith(resident),
    })('2024-03-10 00:00:00', '2024-03-10 23:59:59');

    expect(state.calls.map(call => call.time).sort()).toEqual([
      '2024-03-10 09:00:00',
      '2024-03-10 10:00:00',
      '2024-03-10 10:05:00',
      '2024-03-11 08:00:00',
    ]);
  });

  it('asks the storage once per synchronization, not once per call', async () => {
    const { repository } = createFakeCallsRepository();
    const findByTimeRange = vi.spyOn(repository, 'findByTimeRange');

    await createSyncCalls({
      source: { getCalls: async () => incoming },
      calls: repository,
      gateUsers: gateUsersWith(resident),
    })('from', 'to');

    expect(findByTimeRange).toHaveBeenCalledTimes(1);
    expect(findByTimeRange).toHaveBeenCalledWith('2024-03-10 09:00:00', '2024-03-10 10:05:00');
  });

  // regression: filling in a missed day took a minute, a repeated request started a second synchronization
  // meanwhile and the same 70 calls were stored twice
  it('does not store calls twice when synchronizations overlap', async () => {
    const { repository, state } = createFakeCallsRepository();
    const slowSource = { getCalls: async () => { await new Promise(resolve => setTimeout(resolve, 20)); return incoming; } };
    let clock = new Date('2024-03-10T12:00:00.000Z').getTime();
    const now = () => new Date(clock);

    const syncCalls = createSyncCalls({ source: slowSource, calls: repository, gateUsers: gateUsersWith(resident), now });
    const refreshCalls = createRefreshCalls({ calls: repository, syncCalls, today: () => '2024-03-10', now });

    const first = refreshCalls('from', 'to');
    clock += 6000; // the rate limit interval has passed while the telephony was answering
    await first;
    await refreshCalls('from', 'to'); // arrives right after the first one has written: the interval was restarted

    expect(state.calls).toHaveLength(3);
    expect(new Set(state.calls.map(call => `${call.number}|${call.time}`)).size).toBe(3);
  });

  it('writes all new calls with one request and looks the callers up once', async () => {
    const { repository } = createFakeCallsRepository();
    const gateUsers = gateUsersWith(resident);
    const addMany = vi.spyOn(repository, 'addMany');
    const findByPhoneNumbers = vi.spyOn(gateUsers, 'findByPhoneNumbers');

    await createSyncCalls({ source: { getCalls: async () => incoming }, calls: repository, gateUsers })('from', 'to');

    expect(addMany).toHaveBeenCalledTimes(1);
    expect(findByPhoneNumbers).toHaveBeenCalledTimes(1);
    expect(findByPhoneNumbers).toHaveBeenCalledWith(['380501111111', '380509999999']);
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
  const today = () => '2024-03-10';

  it('goes to the telephony not more often than once per 5 seconds by default', async () => {
    expect(DEFAULT_SYNC_INTERVAL_SECONDS).toBe(5);

    const { repository } = createFakeCallsRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const syncCalls = vi.fn(async () => 0);

    await createRefreshCalls({ calls: repository, syncCalls, today, now: at('2024-03-10T12:00:03.000Z') })('from', 'to');
    await createRefreshCalls({ calls: repository, syncCalls, today, now: at('2024-03-10T12:00:05.000Z') })('from', 'to');
    expect(syncCalls).not.toHaveBeenCalled();

    await createRefreshCalls({ calls: repository, syncCalls, today, now: at('2024-03-10T12:00:05.001Z') })('from', 'to');
    expect(syncCalls).toHaveBeenCalledTimes(1);
    expect(syncCalls).toHaveBeenCalledWith('from', 'to');
  });

  it('lets only one of several simultaneous requests through', async () => {
    const { repository } = createFakeCallsRepository();
    const syncCalls = vi.fn(async () => 0);
    const refreshCalls = createRefreshCalls({ calls: repository, syncCalls, today, now: at('2024-03-10T12:00:00.000Z') });

    await Promise.all([refreshCalls('from', 'to'), refreshCalls('from', 'to'), refreshCalls('from', 'to')]);

    expect(syncCalls).toHaveBeenCalledTimes(1);
  });

  it('keeps the limit when the synchronization fails', async () => {
    const { repository } = createFakeCallsRepository();
    const syncCalls = vi.fn(async () => { throw new Error('telephony is down'); });
    const refreshCalls = createRefreshCalls({ calls: repository, syncCalls, today, now: at('2024-03-10T12:00:00.000Z') });

    await expect(refreshCalls('from', 'to')).rejects.toThrow('telephony is down');
    await refreshCalls('from', 'to');

    expect(syncCalls).toHaveBeenCalledTimes(1);
  });

  it('uses the interval of the tenant', async () => {
    const { repository } = createFakeCallsRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const syncCalls = vi.fn(async () => 0);

    await createRefreshCalls({
      calls: repository, syncCalls, today, minIntervalSeconds: 60, now: at('2024-03-10T12:00:30.000Z'),
    })('from', 'to');

    expect(syncCalls).not.toHaveBeenCalled();
  });
});

describe('refreshCalls (finished days are read from the storage)', () => {
  const today = () => '2024-03-10';
  const day = (value: string): [string, string] => [`${value} 00:00:00`, `${value} 23:59:59`];
  const setup = () => {
    const { repository, state } = createFakeCallsRepository();
    const syncCalls = vi.fn(async () => 0);
    let clock = new Date('2024-03-10T12:00:00.000Z').getTime();
    const refreshCalls = createRefreshCalls({
      calls: repository, syncCalls, today, now: () => new Date(clock += 60_000),
    });
    return { state, syncCalls, refreshCalls };
  };

  it('loads a finished day from the telephony once, then never again', async () => {
    const { state, syncCalls, refreshCalls } = setup();

    await refreshCalls(...day('2024-03-08'));
    expect(syncCalls).toHaveBeenCalledTimes(1);
    expect(Array.from(state.filledDays)).toEqual(['2024-03-08']);

    await refreshCalls(...day('2024-03-08'));
    expect(syncCalls).toHaveBeenCalledTimes(1);
  });

  it('always asks the telephony about today and never marks it as filled', async () => {
    const { state, syncCalls, refreshCalls } = setup();

    await refreshCalls(...day('2024-03-10'));
    await refreshCalls(...day('2024-03-10'));

    expect(syncCalls).toHaveBeenCalledTimes(2);
    expect(state.filledDays.size).toBe(0);
  });

  it('marks only the finished days of a period that reaches today', async () => {
    const { state, refreshCalls } = setup();

    await refreshCalls('2024-03-09 00:00:00', '2024-03-10 23:59:59');

    expect(Array.from(state.filledDays)).toEqual(['2024-03-09']);
  });

  it('does not mark days when the telephony was not asked or has failed', async () => {
    const { repository, state } = createFakeCallsRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const busy = createRefreshCalls({
      calls: repository, syncCalls: vi.fn(async () => 0), today, now: () => new Date('2024-03-10T12:00:01.000Z'),
    });
    await busy(...day('2024-03-08'));
    expect(state.filledDays.size).toBe(0);

    const failing = createRefreshCalls({
      calls: repository,
      syncCalls: vi.fn(async () => { throw new Error('telephony is down'); }),
      today,
      now: () => new Date('2024-03-10T13:00:00.000Z'),
    });
    await expect(failing(...day('2024-03-08'))).rejects.toThrow('telephony is down');
    expect(state.filledDays.size).toBe(0);
  });

  it('does not trust one request for a very long period', async () => {
    const { state, syncCalls, refreshCalls } = setup();

    await refreshCalls('2023-12-01 00:00:00', '2024-03-09 23:59:59');

    expect(syncCalls).toHaveBeenCalledTimes(1);
    expect(state.filledDays.size).toBe(0);
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
