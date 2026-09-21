import { describe, expect, it } from 'vitest';
import { Call } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createFakeGateUsersRepository } from './__fixtures__/fakeGateUsersRepository';
import { createFakePenaltiesRepository } from './__fixtures__/fakePenaltiesRepository';
import { createRestorePenalties } from './restorePenalties';

const call = (number: string, time: string, overrides: Partial<Call> = {}): Call => ({
  number, time, apartmentNumber: '485', callerName: 'Resident', carNumber: [], isBlackListed: false, outcome: 'opened',
  blackListedFrom: '', blackListedTo: '',
  ...overrides,
} as unknown as Call);

const blocked = (from: string, until: string) => ({ isBlackListed: true, blackListedFrom: from, blackListedTo: until });

const NOW = () => new Date('2026-09-21T12:00:00');

const setup = (calls: Call[], users: GateUser[] = []) => {
  const penalties = createFakePenaltiesRepository();
  const restore = createRestorePenalties({
    calls: createFakeCallsRepository(calls).repository,
    gateUsers: createFakeGateUsersRepository(users).repository,
    penalties: penalties.repository,
    now: NOW,
  });
  return { penalties, restore };
};

describe('restorePenalties', () => {
  const history = [
    call('380680000035', '2026-05-20 09:00:00'), call('380680000035', '2026-05-20 10:29:00'),    // 89 minutes
    call('380960000093', '2026-05-25 18:00:00'),                                                  // no exit
    // both phones were blocked within seconds and called while blocked
    call('380680000035', '2026-05-30 08:00:00', blocked('2026-05-28 23:16:23', '2026-06-12 23:50:00')),
    call('380960000093', '2026-05-29 08:00:00', blocked('2026-05-28 23:16:13', '2026-06-12 23:50:00')),
    call('380960000093', '2026-06-11 08:00:00', blocked('2026-05-28 23:16:13', '2026-06-12 23:50:00')),
    // punished again in August, for one overstay after the first penalty
    call('380960000093', '2026-07-01 09:00:00'), call('380960000093', '2026-07-01 10:00:00'),    // 60 minutes
    call('380960000093', '2026-08-06 08:00:00', blocked('2026-08-05 22:52:06', '2026-08-13 23:50:00')),
    // too old
    call('380960000093', '2025-10-03 08:00:00', blocked('2025-10-02 10:18:00', '2025-10-10 23:50:00')),
  ];

  it('finds the penalties of apartments in the snapshots of the calls, with what they were for', async () => {
    const { penalties, restore } = setup(history);

    const result = await restore('2026-01-01 00:00:00');

    expect(result).toMatchObject({ blocks: 3, found: 2, written: 0 });
    expect(result.missing).toHaveLength(2);
    expect(result.missing[0]).toMatchObject({
      subjectKey: '485',
      phoneNumbers: ['380960000093', '380680000035'],
      from: '2026-05-28 23:16:13',
      until: '2026-06-12 23:50:00',
      imposedBy: null,
      source: 'restoredFromCalls',
      lifted: { at: '2026-06-12 23:50:00', how: 'expired' },
      reason: { overstays: 1, openVisits: 1, overstayMinutes: 89, minutesOverLimit: 44 },
    });
    // the second penalty answers only for what happened after the first one ended
    expect(result.missing[1].reason).toMatchObject({ since: '2026-06-12 23:50:00', overstays: 1, openVisits: 0, overstayMinutes: 60 });
    // a dry run writes nothing
    expect(penalties.state.penalties).toEqual([]);
  });

  it('does not guess from the calls how a penalty ended: it is closed by its own term', async () => {
    const { restore } = setup([
      call('380960000093', '2026-08-06 09:32:12', blocked('2026-08-05 22:52:06', '2026-08-13 23:50:00')),
      // the gate opened for the same phone before the end of the term: still not a proof of anything
      call('380960000093', '2026-08-09 08:15:00'),
    ]);

    const { missing } = await restore('2026-01-01 00:00:00');

    expect(missing[0].lifted).toMatchObject({ at: '2026-08-13 23:50:00', how: 'expired' });
  });

  it('writes only what is missing, however many times it runs', async () => {
    const { penalties, restore } = setup(history);

    expect((await restore('2026-01-01 00:00:00', { apply: true })).written).toBe(2);
    expect((await restore('2026-01-01 00:00:00', { apply: true })).written).toBe(0);
    expect(penalties.state.penalties).toHaveLength(2);
  });

  it('adds the penalty that is in force now even if the blocked person never called', async () => {
    const user = {
      id: '1', externalId: '1', name: 'Resident', phoneNumber: '380660000056', carNumber: [], apartmentNumber: '441',
      ...blocked('2026-09-20 17:35:42', '2026-09-28 23:50:00'),
    } as GateUser;
    const { restore } = setup([], [user]);

    const { missing } = await restore('2026-01-01 00:00:00');

    expect(missing).toHaveLength(1);
    expect(missing[0]).toMatchObject({ subjectKey: '441', lifted: null });
  });

  it('skips snapshots without readable dates', async () => {
    const { restore } = setup([call('380680000035', '2026-05-30 08:00:00', blocked('2026-05-28', ''))]);

    expect((await restore('2026-01-01 00:00:00')).found).toBe(0);
  });
});
