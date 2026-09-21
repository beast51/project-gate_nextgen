import { describe, expect, it } from 'vitest';
import { GateUser } from '../entities/gateUser';
import { Call } from '../entities/call';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createFakePenaltiesRepository } from './__fixtures__/fakePenaltiesRepository';
import { createPenaltyRecorder } from './penalties';

const actor = { id: 'a1', name: 'Olga' };

const resident = (phoneNumber: string, overrides: Partial<GateUser> = {}): GateUser => ({
  id: phoneNumber,
  externalId: phoneNumber,
  name: 'Resident',
  phoneNumber,
  carNumber: [],
  apartmentNumber: '485',
  isBlackListed: true,
  blackListedFrom: '2026-09-10 08:00:00',
  blackListedTo: '2026-09-18 23:50:00',
  ...overrides,
} as GateUser);

const passage = (time: string, overrides: Partial<Call> = {}): Call => ({
  number: '380680000035', time, apartmentNumber: '485', callerName: 'Resident', carNumber: [], isBlackListed: false, outcome: 'opened',
  ...overrides,
} as unknown as Call);

const setup = (now = '2026-09-10T08:00:30', stored: Call[] = []) => {
  const { repository, state } = createFakePenaltiesRepository();
  const calls = createFakeCallsRepository(stored).repository;
  return { state, recorder: createPenaltyRecorder({ penalties: repository, calls, actor, now: () => new Date(now) }) };
};

describe('penalties', () => {
  it('counts the phones of an apartment blocked one after another as one penalty', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380680000035', { blackListedFrom: '2026-09-10 08:00:13' }));
    await recorder.imposed(resident('380960000093', { blackListedFrom: '2026-09-10 08:00:23' }));

    expect(state.penalties).toHaveLength(1);
    expect(state.penalties[0]).toMatchObject({
      subjectKey: '485',
      apartmentNumber: '485',
      phoneNumbers: ['380680000035', '380960000093'],
      from: '2026-09-10 08:00:13',
      until: '2026-09-18 23:50:00',
      imposedBy: actor,
      lifted: null,
      source: 'recorded',
    });
  });

  it('starts a new penalty when the apartment is punished again', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380680000035'));
    await recorder.lifted(resident('380680000035'), 'expired');
    await recorder.imposed(resident('380680000035', { blackListedFrom: '2026-10-02 10:00:00', blackListedTo: '2026-10-17 23:50:00' }));

    expect(state.penalties.map(penalty => penalty.from)).toEqual(['2026-09-10 08:00:00', '2026-10-02 10:00:00']);
  });

  it('does not join a block to a penalty that is already lifted, however close', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380680000035'));
    await recorder.lifted(resident('380680000035'), 'manually');
    await recorder.imposed(resident('380680000035', { blackListedFrom: '2026-09-10 08:10:00' }));

    expect(state.penalties).toHaveLength(2);
  });

  it('a longer term is the same penalty', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380680000035'));
    await recorder.kept(resident('380680000035', { blackListedTo: '2026-09-25 23:50:00' }));

    expect(state.penalties).toHaveLength(1);
    expect(state.penalties[0].until).toBe('2026-09-25 23:50:00');
  });

  it('starts the record for somebody who was blocked before penalties were recorded', async () => {
    const { state, recorder } = setup();

    await recorder.kept(resident('380680000035', { blackListedFrom: '2026-09-01 12:00:00' }));
    await recorder.kept(resident('380680000035', { blackListedFrom: '2026-09-01 12:00:00' }));

    expect(state.penalties).toHaveLength(1);
    expect(state.penalties[0].from).toBe('2026-09-01 12:00:00');
  });

  it('remembers how and when the penalty ended', async () => {
    const { state, recorder } = setup('2026-09-12T09:30:00');

    await recorder.imposed(resident('380680000035'));
    await recorder.lifted(resident('380680000035'), 'manually');

    expect(state.penalties[0].lifted).toEqual({ at: '2026-09-12 09:30:00', how: 'manually', ground: null, comment: null });
  });

  it('punishes a caller without an apartment alone', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380500000001', { apartmentNumber: null }));
    await recorder.imposed(resident('380500000002', { apartmentNumber: null }));

    expect(state.penalties.map(penalty => penalty.subjectKey)).toEqual(['380500000001', '380500000002']);
  });

  it('has nothing to lift for somebody without a recorded penalty', async () => {
    const { state, recorder } = setup();

    await recorder.lifted(resident('380680000035'), 'expired');

    expect(state.penalties).toEqual([]);
  });

  it('keeps what the operator wrote, once for the phones of an apartment', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380680000035'), { ground: 'tailgating', comment: '  Паровоз  ' });
    await recorder.imposed(resident('380960000093'), { ground: 'cheater', comment: 'Паровоз' });
    expect(state.penalties[0]).toMatchObject({ ground: 'tailgating', comment: 'Паровоз' });

    await recorder.imposed(resident('380960000094'), { comment: 'і ще хамив охороні' });
    expect(state.penalties[0].comment).toBe('Паровоз\nі ще хамив охороні');

    await recorder.lifted(resident('380680000035'), 'manually', { ground: 'delivery', comment: 'Доставка' });
    expect(state.penalties[0].lifted).toMatchObject({ ground: 'delivery', comment: 'Доставка' });
  });

  it('cuts a comment that is too long and treats an empty one as none', async () => {
    const { state, recorder } = setup();

    await recorder.imposed(resident('380680000035'), { comment: 'x'.repeat(2000) });
    await recorder.imposed(resident('380500000001', { apartmentNumber: null }), { ground: 'made up', comment: '   ' });

    expect(state.penalties[0].comment).toHaveLength(500);
    // an unknown ground is not stored, and a ground of lifting is not a ground of a penalty
    expect(state.penalties[1]).toMatchObject({ ground: null, comment: null });
  });

  it('remembers what the penalty is for: the violations since the previous penalty ended', async () => {
    const { state, recorder } = setup('2026-09-10T08:00:30', [
      passage('2026-08-20 09:00:00'), passage('2026-08-20 11:00:00'),                     // 120 min, before the previous penalty ended
      passage('2026-09-05 09:00:00'), passage('2026-09-05 10:29:00'),                     // 89 min: 44 over the limit
      passage('2026-09-07 12:00:00'), passage('2026-09-07 12:20:00'),                     // fine
      passage('2026-09-08 18:00:00'),                                                     // no exit that day
      passage('2026-09-09 10:00:00'), passage('2026-09-09 11:00:00'),                     // 60 min: 15 over
      passage('2026-09-09 10:00:00', { number: '380990000000', apartmentNumber: '7' }),   // another apartment
    ]);

    await recorder.imposed(resident('380680000035', { blackListedFrom: '2026-08-21 10:00:00', blackListedTo: '2026-08-29 23:50:00' }));
    await recorder.lifted(resident('380680000035'), 'expired');
    state.penalties[0].lifted = { at: '2026-08-30 00:05:00', how: 'expired', ground: 'termExpired', comment: null };
    await recorder.imposed(resident('380680000035'), { ground: 'overstay' });

    expect(state.penalties[1].reason).toEqual({
      since: '2026-08-30 00:05:00', overstays: 2, openVisits: 1, overstayMinutes: 149, minutesOverLimit: 59,
    });
  });

  it('looks back three months at most when there was no penalty before', async () => {
    const { state, recorder } = setup('2026-09-10T08:00:30', [
      passage('2026-05-01 09:00:00'), passage('2026-05-01 12:00:00'),   // too old
      passage('2026-09-01 09:00:00'), passage('2026-09-01 10:00:00'),
    ]);

    await recorder.imposed(resident('380680000035'));

    expect(state.penalties[0].reason).toMatchObject({ since: '2026-06-10 08:00:30', overstays: 1, overstayMinutes: 60 });
  });

  it('imposes the penalty even when its reason can not be counted', async () => {
    const { repository, state } = createFakePenaltiesRepository();
    const calls = createFakeCallsRepository().repository;
    calls.findPassagesOfSubject = async () => { throw new Error('the storage is down'); };

    await createPenaltyRecorder({ penalties: repository, calls, actor, now: () => new Date('2026-09-10T08:00:30') })
      .imposed(resident('380680000035'), { ground: 'cheater' });

    expect(state.penalties[0]).toMatchObject({ ground: 'cheater', reason: null });
  });
});
