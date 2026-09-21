import { describe, expect, it } from 'vitest';
import { PassageCall } from '../entities/call';
import { defaultViolationRules, findViolations, unpairedPassageIndex } from './findViolations';
import { Call } from '../entities/call';

const DAY = '2026-09-10';
const at = (clock: string) => `${DAY} ${clock.length === 5 ? `${clock}:00` : clock}`;

const call = (clock: string, overrides: Partial<PassageCall> = {}): Call => ({
  number: '380501111111', time: at(clock), apartmentNumber: '49', callerName: 'Resident', carNumber: [], isBlackListed: false, outcome: 'opened',
  ...overrides,
} as unknown as Call);

// the day is over
const LATER = new Date('2026-09-12T12:00:00');

const read = (clocks: (string | Call)[], now = LATER) => {
  const { visits, violationCount } = findViolations(clocks.map(item => (typeof item === 'string' ? call(item) : item)), {}, now)['49'];
  return { violationCount, visits: visits.map(visit => `${visit.timeIn.slice(11, 16)}-${visit.timeOut ? String(visit.timeOut).slice(11, 16) : '?'}`) };
};

describe('the passage without a pair', () => {
  // the case the rule was made for: a train at 13:47, an ordinary visit in the evening
  it('is the one whose absence leaves the most plausible day, not simply the last one', () => {
    expect(read(['13:47', '21:16', '21:25'])).toEqual({ visits: ['13:47-?', '21:16-21:25'], violationCount: 1 });
  });

  it('may be in the middle of the day', () => {
    expect(read(['09:00', '09:10', '13:00', '18:00', '18:12'])).toEqual({ visits: ['09:00-09:10', '13:00-?', '18:00-18:12'], violationCount: 1 });
  });

  // real calls: "НП", 04.07.2026 — used to be three overstays
  it('reads a long day of a busy apartment without inventing overstays', () => {
    expect(read(['06:52', '11:23', '11:34', '15:13', '15:21', '18:10', '18:15'])).toEqual({
      visits: ['06:52-?', '11:23-11:34', '15:13-15:21', '18:10-18:15'],
      violationCount: 1,
    });
  });

  // real calls: apartment 49, 25.08.2026 — every reading has an overstay, 77 minutes is likelier than 13 hours
  it('prefers fewer minutes when an overstay is there in any reading', () => {
    expect(read(['08:43', '21:55', '23:13'])).toEqual({ visits: ['08:43-?', '21:55-23:13'], violationCount: 2 });
  });

  it('prefers fewer overstays to fewer minutes', () => {
    // without 10:00: 6 + 46 minutes, the shortest day, but with an overstay. Without 12:20: 44 + 44 minutes, none.
    expect(unpairedPassageIndex(['10:00', '10:44', '10:50', '11:34', '12:20'].map(at), defaultViolationRules)).toBe(4);
  });

  it('is the last one when it really is, as before', () => {
    expect(read(['09:00', '09:10', '18:00'])).toEqual({ visits: ['09:00-09:10', '18:00-?'], violationCount: 1 });
    expect(unpairedPassageIndex(['09:00', '09:10', '18:00'].map(at), defaultViolationRules)).toBe(2);
  });

  it('is the only passage of the day', () => {
    expect(read(['16:10'])).toEqual({ visits: ['16:10-?'], violationCount: 1 });
  });

  it('does not exist in a day with an even number of passages: nothing changes there', () => {
    expect(unpairedPassageIndex(['13:47', '21:16'].map(at), defaultViolationRules)).toBe(-1);
    expect(read(['13:47', '21:16'])).toEqual({ visits: ['13:47-21:16'], violationCount: 1 });
    expect(read(['13:47', '21:16', '21:25', '21:40'])).toEqual({ visits: ['13:47-21:16', '21:25-21:40'], violationCount: 1 });
  });

  describe('today, while the day goes on', () => {
    it('a fresh entry stays open and is not a violation yet', () => {
      expect(read(['09:00', '09:10', '18:00'], new Date(`${DAY}T18:20:00`))).toEqual({ visits: ['09:00-09:10', '18:00-?'], violationCount: 0 });
    });

    it('a train of the morning is seen at once, the evening visit is an ordinary one', () => {
      expect(read(['13:47', '21:16', '21:25'], new Date(`${DAY}T21:30:00`))).toEqual({ visits: ['13:47-?', '21:16-21:25'], violationCount: 1 });
    });
  });

  describe('calls are joined into passages before the pairs are made', () => {
    // the caller did not get through at once and dialled again 40 seconds later
    it('a redial is not a passage of its own', () => {
      expect(read(['13:47:10', '13:47:50', '21:16', '21:25'])).toEqual({ visits: ['13:47-?', '21:16-21:25'], violationCount: 1 });
    });

    // two cars of the apartment drive in one after another and leave apart: three passages.
    // Nobody can tell that there were two cars; what matters is that no overstay is invented.
    it('two cars that came together do not become an overstay', () => {
      const second = { number: '380502222222' };
      expect(read([call('10:00:00'), call('10:00:50', second), call('10:20'), call('10:30', second)]).violationCount).toBe(1);
    });
  });
});
