import moment from 'moment';
import { PassageCall } from '../entities/call';
import { PeriodCounts, ViolationCounts, ViolationRules, ViolationStats } from '../entities/violation';
import { countViolations } from './findViolations';

const DAY_FORMAT = 'YYYY-MM-DD';

// the day of a call; times are stored as 'YYYY-MM-DD HH:mm:ss' in the local time of the gate
export const dayOf = (time: string) => time.slice(0, 10);

const FAR_FUTURE = new Date(8640000000000000);

// day -> apartment or phone -> violations of that day.
//
// Every calendar day is judged on its own. Entries and exits are paired in the order of the calls, so on a
// period of several days one unpaired call shifts every following pair: an entry of today that was never
// closed would be "closed" by the first call of tomorrow. (Measured on 90 days of real calls: 1663
// violations as one period against 685 day by day.)
//
// `now` is the current moment in the local time of the gate. A day that is over is judged as finished:
// an entry without an exit is an open visit. Today it is one only after the limit has passed.
export const countViolationsByDay = (
  calls: PassageCall[],
  rules: Partial<ViolationRules> = {},
  now: Date = new Date(),
): Map<string, Record<string, ViolationCounts>> => {
  const today = moment(now).format(DAY_FORMAT);
  const callsByDay = new Map<string, PassageCall[]>();

  [...calls]
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(call => callsByDay.set(dayOf(call.time), [...(callsByDay.get(dayOf(call.time)) ?? []), call]));

  return new Map(
    Array.from(callsByDay, ([day, dayCalls]) => [day, countViolations(dayCalls, rules, day < today ? FAR_FUTURE : now)]),
  );
};

export type StatsPeriods = {
  week: [string, string]
  month: [string, string]
  threeMonths: [string, string]
  // everything that has to be read to fill the three periods
  whole: [string, string]
}

// The periods around a chosen day, as calendar days 'YYYY-MM-DD', both borders inclusive
export const statsPeriods = (chosenDay: string): StatsPeriods => {
  const day = moment(chosenDay, DAY_FORMAT, true);
  if (!day.isValid()) throw new Error(`"${chosenDay}" is not a day`);

  const range = (start: moment.Moment, end: moment.Moment): [string, string] => [start.format(DAY_FORMAT), end.format(DAY_FORMAT)];

  const week = range(day.clone().startOf('isoWeek'), day.clone().endOf('isoWeek'));
  const month = range(day.clone().startOf('month'), day.clone().endOf('month'));
  const threeMonths = range(day.clone().subtract(2, 'months').startOf('month'), day.clone().endOf('month'));
  // the week of the chosen day may end in the next month
  const whole: [string, string] = [threeMonths[0], week[1] > month[1] ? week[1] : month[1]];

  return { week, month, threeMonths, whole };
};

const NOTHING: PeriodCounts = { overstays: 0, openVisits: 0, penalties: 0 };

const PERIODS = ['week', 'month', 'threeMonths'] as const;

// `penaltyDays`: apartment or phone -> the days its penalties started on
export const sumViolationStats = (
  byDay: Map<string, Record<string, ViolationCounts>>,
  periods: StatsPeriods,
  penaltyDays: Record<string, string[]> = {},
): Record<string, ViolationStats> => {
  const stats: Record<string, ViolationStats> = {};

  Object.entries(penaltyDays).forEach(([key, days]) => {
    days.forEach(day => PERIODS.forEach(period => {
      const [from, to] = periods[period];
      if (day < from || day > to) return;
      stats[key] ??= { week: { ...NOTHING }, month: { ...NOTHING }, threeMonths: { ...NOTHING } };
      stats[key][period].penalties += 1;
    }));
  });

  byDay.forEach((byKey, day) => {
    Object.entries(byKey).forEach(([key, counts]) => {
      if (counts.overstays === 0 && counts.openVisits === 0) return;

      stats[key] ??= { week: { ...NOTHING }, month: { ...NOTHING }, threeMonths: { ...NOTHING } };

      PERIODS.forEach(period => {
        const [from, to] = periods[period];
        if (day < from || day > to) return;
        stats[key][period].overstays += counts.overstays;
        stats[key][period].openVisits += counts.openVisits;
      });
    });
  });

  return stats;
};
