import { CallsRepository } from '../ports/callsRepository';
import { daysBetween, isDay } from './days';
import { DEFAULT_SYNC_INTERVAL_SECONDS } from './syncCalls';

type Dependencies = {
  calls: CallsRepository
  syncCalls: (from: string, to: string) => Promise<number>
  today: () => string
  minIntervalSeconds?: number
  now?: () => Date
}

export type BackfillStep =
  | { status: 'done' }
  // somebody else has just used the telephony: come back later
  | { status: 'rateLimited', remaining: number }
  | { status: 'filled', day: string, added: number, remaining: number }

// Loads the history that was never loaded, ONE day per call and through the same rate limit guard the
// operators use. There is deliberately no "fill everything" operation: the pace belongs to the caller
// (a script with pauses, a nightly job), so the telephony provider never sees a burst of requests.
export const createBackfillCalls = ({
  calls,
  syncCalls,
  today,
  minIntervalSeconds = DEFAULT_SYNC_INTERVAL_SECONDS,
  now = () => new Date(),
}: Dependencies) => {
  const pendingDays = async (fromDay: string, toDay: string) => {
    if (!isDay(fromDay) || !isDay(toDay) || fromDay > toDay) throw new Error('A period of days is expected');

    const currentDay = today();
    const filled = new Set(await calls.listFilledDays(fromDay, toDay));

    // the newest first: recent statistics become correct first
    return daysBetween(fromDay, toDay).filter(day => day < currentDay && !filled.has(day)).reverse();
  };

  return {
    pendingDays,

    fillNextDay: async (fromDay: string, toDay: string): Promise<BackfillStep> => {
      const pending = await pendingDays(fromDay, toDay);
      const [day] = pending;

      if (!day) return { status: 'done' };

      if (!await calls.claimSync(now(), minIntervalSeconds)) {
        return { status: 'rateLimited', remaining: pending.length };
      }

      const added = await syncCalls(`${day} 00:00:00`, `${day} 23:59:59`);
      await calls.markDaysFilled([day], now());

      return { status: 'filled', day, added, remaining: pending.length - 1 };
    },
  };
};
