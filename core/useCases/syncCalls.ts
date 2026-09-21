import { CallToStore, IncomingCall, UNREGISTERED_CALLER_NAME } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { CallsRepository } from '../ports/callsRepository';
import { CallsSource } from '../ports/callsSource';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { PenaltiesRepository } from '../ports/penaltiesRepository';
import { Penalty } from '../entities/penalty';
import { daysBetween, isDay } from './days';
import { dayOf } from './violationStats';

// The telephony API is rate limited: not more than one synchronization per this number of seconds
export const DEFAULT_SYNC_INTERVAL_SECONDS = 5;

// History may be loaded long after the call. A penalty that started later did not exist for that call.
const wasBlackListedAt = (caller: GateUser | null, time: string) =>
  Boolean(caller?.isBlackListed) && !(caller?.blackListedFrom && time < caller.blackListedFrom);

// The penalty the phone was under at that moment. Only penalties the application recorded itself count: their
// start and end are facts. A penalty restored from old calls has a guessed end, it proves nothing about other calls.
const penaltyAt = (penalties: Penalty[], number: string, time: string) =>
  penalties.find(penalty =>
    penalty.source === 'recorded'
    && penalty.phoneNumbers.includes(number) && penalty.from <= time && time <= (penalty.lifted?.at ?? penalty.until));

// A stored call keeps a snapshot of the caller: later changes of the gate user must not rewrite the history.
// `penalty`: the recorded penalty of the caller at the moment of the call. It is the truth about the past;
// without it the state of the gate user today is all there is.
export const toStoredCall = (call: IncomingCall, caller: GateUser | null, penalty?: Penalty): CallToStore => {
  const isBlackListed = Boolean(penalty) || wasBlackListedAt(caller, call.time);

  return {
    number: call.number,
    time: call.time,
    callerName: caller?.name || UNREGISTERED_CALLER_NAME,
    carNumber: caller?.carNumber,
    apartmentNumber: caller?.apartmentNumber,
    image: caller?.image,
    isBlackListed,
    blackListedFrom: penalty?.from || (isBlackListed && caller?.blackListedFrom) || '',
    blackListedTo: penalty?.until || (isBlackListed && caller?.blackListedTo) || '',
    secondsFullTime: call.secondsFullTime,
    outcome: call.outcome,
    cause: call.cause,
    state: call.state,
  };
};

// one phone can not make two calls in the same second
const callKey = (call: { number: string, time: string }) => `${call.number}|${call.time}`;

type Dependencies = {
  source: CallsSource
  calls: CallsRepository
  gateUsers: GateUsersRepository
  // history is loaded later than it happened: the record of penalties tells who was blocked then
  penalties?: PenaltiesRepository
  now?: () => Date
}

// the longest term of a penalty, with a margin: a penalty that started earlier can not cover the calls
const LONGEST_PENALTY_DAYS = 45;

export const createSyncCalls = ({ source, calls, gateUsers, penalties, now = () => new Date() }: Dependencies) =>
  // returns how many calls were new
  async (from: string, to: string): Promise<number> => {
    const incomingCalls = await source.getCalls(from, to);

    if (incomingCalls.length === 0) return 0;

    // The telephony may answer slowly. The write phase starts with a fresh exclusive interval, so a request
    // that comes meanwhile can not start a second synchronization that would store the same calls again.
    await calls.extendSync(now());

    // Calls are compared with what is already stored for the same period, not with the newest stored call:
    // a day nobody looked at is filled in whenever it is requested, even if later days are already stored.
    const times = incomingCalls.map(call => call.time).sort();
    const stored = await calls.findByTimeRange(times[0], times[times.length - 1]);
    const known = new Set(stored.map(call => callKey(call)));

    const newCalls = incomingCalls.filter(call => {
      if (known.has(callKey(call))) return false;
      known.add(callKey(call));
      return true;
    });

    if (newCalls.length === 0) return 0;

    // two requests for the whole synchronization: the callers and one batch insert
    const callers = await gateUsers.findByPhoneNumbers(Array.from(new Set(newCalls.map(call => call.number))));
    const callerByNumber = new Map(callers.map(caller => [caller.phoneNumber, caller]));

    const newTimes = newCalls.map(call => call.time).sort();
    const earliest = new Date(new Date(newTimes[0].replace(' ', 'T')).getTime() - LONGEST_PENALTY_DAYS * 24 * 60 * 60 * 1000);
    const pad = (value: number) => String(value).padStart(2, '0');
    const recorded = penalties
      ? await penalties.listStartedBetween(
        `${earliest.getFullYear()}-${pad(earliest.getMonth() + 1)}-${pad(earliest.getDate())} 00:00:00`,
        newTimes[newTimes.length - 1],
      )
      : [];

    await calls.addMany(newCalls.map(call => {
      const caller = callerByNumber.get(call.number) ?? null;
      return { call: toStoredCall(call, caller, penaltyAt(recorded, call.number, call.time)), gateUserId: caller?.id };
    }));

    return newCalls.length;
  };

type RefreshDependencies = {
  calls: CallsRepository
  syncCalls: (from: string, to: string) => Promise<number>
  // today in the local time of the gate, 'YYYY-MM-DD'
  today: () => string
  minIntervalSeconds?: number
  now?: () => Date
}

// One request to the telephony returns a limited number of calls, so a long period may come back cut.
// Days are marked as filled only after a request that certainly was not.
const MAX_DAYS_MARKED_AT_ONCE = 31;

// Brings the calls of a period up to date.
//  - A day that is over and was already loaded after its end is complete: it is read from the storage,
//    the telephony is not asked. Only today and the days that were never loaded need the telephony.
//  - The telephony is asked only when the rate limit allows it. The slot is claimed before the call,
//    so concurrent requests and a failed synchronization can not exceed the limit.
export const createRefreshCalls = ({
  calls,
  syncCalls,
  today,
  minIntervalSeconds = DEFAULT_SYNC_INTERVAL_SECONDS,
  now = () => new Date(),
}: RefreshDependencies) =>
  async (from: string, to: string): Promise<void> => {
    const [fromDay, toDay] = [dayOf(from.replace(/"/g, '')), dayOf(to.replace(/"/g, ''))];
    const isPeriodOfDays = isDay(fromDay) && isDay(toDay) && fromDay <= toDay;

    // days of the period that are over and not filled yet; an unreadable period is simply synchronized
    let daysToFill: string[] = [];

    if (isPeriodOfDays) {
      const currentDay = today();
      const pastDays = daysBetween(fromDay, toDay).filter(day => day < currentDay);
      const filled = new Set(pastDays.length > 0 ? await calls.listFilledDays(fromDay, toDay) : []);

      daysToFill = pastDays.filter(day => !filled.has(day));

      const touchesToday = toDay >= currentDay;
      if (!touchesToday && daysToFill.length === 0) return;
    }

    if (!await calls.claimSync(now(), minIntervalSeconds)) return;

    await syncCalls(from, to);

    if (daysToFill.length > 0 && daysToFill.length <= MAX_DAYS_MARKED_AT_ONCE) {
      await calls.markDaysFilled(daysToFill, now());
    }
  };
