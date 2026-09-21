import { describe, expect, it } from 'vitest';
import { GateUser } from '../entities/gateUser';
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

const setup = (now = '2026-09-10T08:00:30') => {
  const { repository, state } = createFakePenaltiesRepository();
  return { state, recorder: createPenaltyRecorder({ penalties: repository, actor, now: () => new Date(now) }) };
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

    expect(state.penalties[0].lifted).toEqual({ at: '2026-09-12 09:30:00', how: 'manually' });
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
});
