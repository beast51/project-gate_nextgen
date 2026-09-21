import { describe, expect, it } from 'vitest';
import { PassageCall } from '../entities/call';
import { countViolations } from './findViolations';
import { countViolationsByDay, statsPeriods, sumViolationStats } from './violationStats';

const call = (time: string, overrides: Partial<PassageCall> = {}): PassageCall => ({
  number: '380501111111',
  time,
  apartmentNumber: '12',
  callerName: 'Ivan',
  isBlackListed: false,
  outcome: 'opened',
  ...overrides,
});

const NOW = new Date('2024-03-12 12:00:00');

describe('countViolationsByDay', () => {
  // the reason the statistics are counted day by day
  it('never closes an open visit of one day with the first call of the next day', () => {
    const calls = [
      call('2024-03-10 22:00:00'),                      // entered in the evening, no exit that day
      call('2024-03-11 08:00:00'),                      // the next morning: a NEW entry, not the exit of yesterday
      call('2024-03-11 08:20:00'),
    ];

    const asOnePeriod = countViolations(calls, {}, NOW)['12'];
    expect(asOnePeriod).toEqual({ overstays: 1, openVisits: 1 });   // 22:00 -> 08:00 "parked for 600 minutes": wrong

    const byDay = countViolationsByDay(calls, {}, NOW);
    expect(byDay.get('2024-03-10')).toEqual({ '12': { overstays: 0, openVisits: 1 } });
    expect(byDay.get('2024-03-11')).toEqual({ '12': { overstays: 0, openVisits: 0 } });
  });

  it('keeps the two kinds of violations apart', () => {
    const byDay = countViolationsByDay([
      call('2024-03-10 09:00:00'), call('2024-03-10 10:00:00'),   // 60 minutes: an overstay
      call('2024-03-10 12:00:00'), call('2024-03-10 12:10:00'),   // fine
      call('2024-03-10 18:00:00'),                                 // no exit: an open visit
    ], {}, NOW);

    expect(byDay.get('2024-03-10')).toEqual({ '12': { overstays: 1, openVisits: 1 } });
  });

  it('judges a finished day as finished and today by the limit', () => {
    const calls = [call('2024-03-11 23:50:00'), call('2024-03-12 11:40:00', { apartmentNumber: '7' })];

    const byDay = countViolationsByDay(calls, {}, NOW);

    // yesterday is over: the entry at 23:50 stayed open, whatever the clock says now
    expect(byDay.get('2024-03-11')).toEqual({ '12': { overstays: 0, openVisits: 1 } });
    // today, 20 minutes ago: the limit of 45 minutes has not passed yet
    expect(byDay.get('2024-03-12')).toEqual({ '7': { overstays: 0, openVisits: 0 } });
    expect(countViolationsByDay(calls, {}, new Date('2024-03-12 13:00:00')).get('2024-03-12')).toEqual({ '7': { overstays: 0, openVisits: 1 } });
  });

  it('ignores the order the calls arrive in and the calls that did not open the gate', () => {
    const byDay = countViolationsByDay([
      call('2024-03-10 10:00:00'),
      call('2024-03-10 09:00:00'),
      call('2024-03-10 09:30:00', { outcome: 'connectionFailed' }),
      call('2024-03-10 09:40:00', { isBlackListed: true }),
    ], {}, NOW);

    expect(byDay.get('2024-03-10')).toEqual({ '12': { overstays: 1, openVisits: 0 } });
  });
});

describe('statsPeriods', () => {
  it('is the calendar week, the calendar month and that month with the two before it', () => {
    expect(statsPeriods('2024-03-14')).toEqual({
      week: ['2024-03-11', '2024-03-17'],
      month: ['2024-03-01', '2024-03-31'],
      threeMonths: ['2024-01-01', '2024-03-31'],
      whole: ['2024-01-01', '2024-03-31'],
    });
  });

  it('follows the chosen day over the borders of months and years', () => {
    // Thursday, the 1st of February 2024: the week began in January
    expect(statsPeriods('2024-02-01')).toMatchObject({ week: ['2024-01-29', '2024-02-04'], threeMonths: ['2023-12-01', '2024-02-29'] });
    // the last day of a month in the middle of a week: the week ends in the next month and has to be read too
    expect(statsPeriods('2024-04-30')).toMatchObject({ week: ['2024-04-29', '2024-05-05'], whole: ['2024-02-01', '2024-05-05'] });
    expect(statsPeriods('2024-01-10').threeMonths).toEqual(['2023-11-01', '2024-01-31']);
    // a Sunday belongs to the week that began on Monday
    expect(statsPeriods('2024-03-17').week).toEqual(['2024-03-11', '2024-03-17']);
    expect(() => statsPeriods('14.03.2024')).toThrow();
  });
});

describe('sumViolationStats', () => {
  it('sums the days of every period for every apartment', () => {
    // every apartment calls from its own phone: two calls of one number within 2 minutes are a redial
    const overstayOn = (day: string, apartmentNumber = '12') => {
      const from = { apartmentNumber, number: `38050${apartmentNumber.padStart(7, '0')}` };
      return [call(`${day} 09:00:00`, from), call(`${day} 10:00:00`, from)];
    };
    const byDay = countViolationsByDay([
      ...overstayOn('2024-01-15'),            // two months ago
      ...overstayOn('2024-03-02'),            // this month, another week
      ...overstayOn('2024-03-12'),            // this week
      call('2024-03-13 20:00:00', { number: '380500000012' }),   // this week, an open visit
      ...overstayOn('2023-12-31'),            // before the three months
      ...overstayOn('2024-03-12', '7'),
    ], {}, new Date('2024-03-20 12:00:00'));

    const stats = sumViolationStats(byDay, statsPeriods('2024-03-14'));

    expect(stats['12']).toEqual({
      week: { overstays: 1, openVisits: 1, penalties: 0 },
      month: { overstays: 2, openVisits: 1, penalties: 0 },
      threeMonths: { overstays: 3, openVisits: 1, penalties: 0 },
    });
    expect(stats['7'].week).toEqual({ overstays: 1, openVisits: 0, penalties: 0 });
  });

  it('lists only those who have violations', () => {
    const byDay = countViolationsByDay([call('2024-03-12 09:00:00'), call('2024-03-12 09:10:00')], {}, NOW);

    expect(sumViolationStats(byDay, statsPeriods('2024-03-12'))).toEqual({});
  });
});
