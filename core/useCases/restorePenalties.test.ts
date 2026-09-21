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

  describe('penalties no note tells about', () => {
    const refused = (number: string, time: string, overrides: Partial<Call> = {}) => call(number, time, { outcome: 'refused', ...overrides });

    // the calls were loaded after the penalty was lifted, so none of them got the note
    it('finds a penalty by the refusals of the gate, from the first to the last one', async () => {
      const { restore } = setup([
        call('380960000093', '2026-03-01 09:00:00'),
        refused('380960000093', '2026-03-03 08:00:00'),
        refused('380960000093', '2026-03-03 08:00:40'),
        refused('380680000035', '2026-03-04 19:00:00'),        // the other phone of the apartment: the same penalty
        refused('380960000093', '2026-03-09 18:30:00'),
        call('380960000093', '2026-03-11 09:00:00'),            // the gate opens again
      ]);

      const result = await restore('2026-01-01 00:00:00');

      expect(result.refusals).toEqual({ calls: 4, penalties: 1 });
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0]).toMatchObject({
        subjectKey: '485',
        phoneNumbers: ['380960000093', '380680000035'],
        from: '2026-03-03 08:00:00',
        until: '2026-03-09 18:30:00',
        source: 'restoredFromRefusals',
        lifted: { at: '2026-03-09 18:30:00', how: 'expired' },
      });
    });

    it('separates two penalties by the gate opening between them, or by a long silence', async () => {
      const { restore } = setup([
        refused('380960000093', '2026-03-03 08:00:00'),
        call('380960000093', '2026-03-05 09:00:00'),
        refused('380960000093', '2026-03-06 08:00:00'),
        refused('380960000093', '2026-05-20 08:00:00'),
      ]);

      expect((await restore('2026-01-01 00:00:00')).missing.map(penalty => penalty.from))
        .toEqual(['2026-03-03 08:00:00', '2026-03-06 08:00:00', '2026-05-20 08:00:00']);
    });

    // real calls of 22.08.2026: refused at 11:37:18, let in at 11:38:08. Nobody lifts a penalty in 50 seconds.
    it('does not take a refusal for a block when the gate opened for the same phone soon after', async () => {
      const { restore } = setup([
        call('380960000093', '2026-08-22 11:30:15'),
        refused('380960000093', '2026-08-22 11:37:18'),
        call('380960000093', '2026-08-22 11:38:08'),
        refused('380960000093', '2026-08-25 10:00:00'),
        call('380960000093', '2026-08-26 09:59:00'),            // 23 hours 59 minutes later: still not enough
      ]);

      expect((await restore('2026-01-01 00:00:00')).found).toBe(0);
    });

    it('does not repeat a penalty a note already tells about', async () => {
      const { restore } = setup([
        refused('380960000093', '2026-08-06 09:32:12', blocked('2026-08-05 22:52:06', '2026-08-13 23:50:00')),
        // loaded later, without the note, but inside the same term
        refused('380960000093', '2026-08-07 17:17:44'),
        refused('380960000093', '2026-08-10 18:52:55'),
      ]);

      const result = await restore('2026-01-01 00:00:00');

      expect(result.refusals.penalties).toBe(0);
      expect(result.missing.map(penalty => penalty.source)).toEqual(['restoredFromCalls']);
    });

    it('does not take a stranger for a blocked resident', async () => {
      const { restore } = setup([refused('380990000000', '2026-03-03 08:00:00', { callerName: 'Not registered', apartmentNumber: null })]);

      expect((await restore('2026-01-01 00:00:00')).found).toBe(0);
    });
  });
});
