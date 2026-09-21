import { ViolationRules, ViolationStats } from '../entities/violation';
import { CallsRepository } from '../ports/callsRepository';
import { daysBetween, GateClock } from './days';
import { countViolationsByDay, StatsPeriods, statsPeriods, sumViolationStats } from './violationStats';

type Dependencies = {
  calls: CallsRepository
  clock: GateClock
  rules?: Partial<ViolationRules>
  // false: the calls do not come from a telephony (a demo), there is nothing that could be missing
  tracksCoverage?: boolean
}

export type ViolationStatsResult = {
  day: string
  periods: Pick<StatsPeriods, 'week' | 'month' | 'threeMonths'>
  // apartment or phone -> violations; only those who have any
  stats: Record<string, ViolationStats>
  // The statistics are only as complete as the stored calls: days that are over but were never loaded
  // from the telephony count as "no violations". They are reported instead of being hidden.
  coverage: { pastDays: number, missingDays: string[] }
}

// Violations around a chosen day. Reads only the storage: three months of history are never requested
// from the telephony because somebody opened a page. Missing days are filled by backfillCalls.
export const createGetViolationStats = ({ calls, clock, rules = {}, tracksCoverage = true }: Dependencies) =>
  async (chosenDay: string): Promise<ViolationStatsResult> => {
    const periods = statsPeriods(chosenDay);
    const [fromDay, toDay] = periods.whole;

    const [passages, filledDays] = await Promise.all([
      calls.findPassagesByTimeRange(`${fromDay} 00:00:00`, `${toDay} 23:59:59`),
      tracksCoverage ? calls.listFilledDays(fromDay, toDay) : [],
    ]);

    const filled = new Set(filledDays);
    const today = clock.today();
    const pastDays = daysBetween(fromDay, toDay).filter(day => day < today);

    return {
      day: chosenDay,
      periods: { week: periods.week, month: periods.month, threeMonths: periods.threeMonths },
      stats: sumViolationStats(countViolationsByDay(passages, rules, clock.now()), periods),
      coverage: {
        pastDays: pastDays.length,
        missingDays: tracksCoverage ? pastDays.filter(day => !filled.has(day)) : [],
      },
    };
  };
