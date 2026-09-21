import { describe, expect, it } from 'vitest';
import { Call } from '../entities/call';
import { Penalty } from '../entities/penalty';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createFakePenaltiesRepository } from './__fixtures__/fakePenaltiesRepository';
import { createGateClock } from './days';
import { findViolations } from './findViolations';
import { createGetSubjectHistory } from './getSubjectHistory';

const call = (time: string, overrides: Partial<Call> = {}): Call => ({
  number: '380971248628', time, apartmentNumber: '174', callerName: 'Vova', carNumber: [], isBlackListed: false, outcome: 'opened',
  ...overrides,
} as unknown as Call);

// 21 September 2026, 13:00 in Kyiv
const clock = createGateClock('Europe/Kyiv', () => new Date('2026-09-21T10:00:00.000Z'));

const setup = (calls: Call[], penalties: Penalty[] = []) => createGetSubjectHistory({
  calls: createFakeCallsRepository(calls).repository,
  penalties: createFakePenaltiesRepository(penalties).repository,
  clock,
});

describe('getSubjectHistory', () => {
  it('lists the violations of the apartment for this month and the two before it, the newest first', async () => {
    const history = await setup([
      call('2026-06-30 09:00:00'), call('2026-06-30 12:00:00'),                                  // before the three calendar months
      call('2026-08-05 14:50:41'), call('2026-08-05 15:40:01'),                                  // 49 minutes
      call('2026-08-05 18:00:00', { number: '380670000001' }), call('2026-08-05 18:10:00'),      // another phone of the apartment, fine
      call('2026-09-19 22:00:00'),                                                                // no exit that day...
      call('2026-09-20 08:00:00'), call('2026-09-20 08:20:00'),                                  // ...and the next morning is a new visit
      call('2026-09-20 10:00:00', { apartmentNumber: '7', number: '380990000000' }),             // another apartment
    ])('174');

    expect(history.period).toEqual(['2026-07-01', '2026-09-21']);
    expect(history.violations).toEqual([
      { day: '2026-09-19', timeIn: '2026-09-19 22:00:00', timeOut: null, minutes: null, kind: 'openVisit' },
      { day: '2026-08-05', timeIn: '2026-08-05 14:50:41', timeOut: '2026-08-05 15:40:01', minutes: 49, kind: 'overstay' },
    ]);
  });

  it('judges today by the clock of the gate', async () => {
    const history = await setup([
      call('2026-09-21 09:02:07'),                                   // almost four hours ago: a violation already
      call('2026-09-21 12:40:00', { number: '380670000001' }),       // another phone of the apartment closes the visit
    ])('174');

    expect(history.violations).toEqual([
      { day: '2026-09-21', timeIn: '2026-09-21 09:02:07', timeOut: '2026-09-21 12:40:00', minutes: 217, kind: 'overstay' },
    ]);

    const fresh = await setup([call('2026-09-21 12:45:00')])('174');
    expect(fresh.violations).toEqual([]);
  });

  // a redial is recognized by the two calls before it, whoever made them: the day is judged as a whole
  it('shows a day exactly as the violations page does, with the calls of the other apartments', async () => {
    const calls = [
      call('2026-09-10 09:00:00'),
      call('2026-09-10 09:00:30', { apartmentNumber: '7', number: '380990000001' }),
      call('2026-09-10 09:00:40', { apartmentNumber: '8', number: '380990000002' }),
      call('2026-09-10 09:01:30'),                                   // a redial, but not next to the first call any more
      call('2026-09-10 12:00:00'),
    ];
    const page = findViolations(calls, {}, clock.now())['174'];

    const history = await setup(calls)('174');

    expect(history.violations.map(item => item.timeIn)).toEqual(
      page.visits.filter(visit => visit.violation !== 'no violation' && visit.violation !== '').map(visit => visit.timeIn),
    );
  });

  it('counts a caller without an apartment by the phone number', async () => {
    const history = await setup([
      call('2026-09-10 09:00:00', { apartmentNumber: null, number: '380500000001' }),
      call('2026-09-10 09:00:00', { apartmentNumber: null, number: '380500000002' }),
    ])('380500000001');

    expect(history.violations).toHaveLength(1);
  });

  it('shows every recorded penalty of the apartment, the newest first', async () => {
    const penalty = (from: string): Penalty => ({
      id: from, subjectKey: '174', apartmentNumber: '174', phoneNumbers: ['380971248628'], from, until: from,
      imposedBy: null, ground: 'overstay', comment: null, reason: null, lifted: null, source: 'recorded',
    });
    const history = await setup([], [penalty('2026-01-15 05:46:16'), penalty('2026-09-10 07:36:45'), { ...penalty('2026-05-01 10:00:00'), subjectKey: '7' }])('174');

    expect(history.penalties.map(item => item.from)).toEqual(['2026-09-10 07:36:45', '2026-01-15 05:46:16']);
  });
});
