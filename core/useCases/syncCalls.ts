import moment from 'moment';
import { CallToStore, IncomingCall, UNREGISTERED_CALLER_NAME } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { CallsRepository } from '../ports/callsRepository';
import { CallsSource } from '../ports/callsSource';
import { GateUsersRepository } from '../ports/gateUsersRepository';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const SYNC_INTERVAL_SECONDS = 10;

// The telephony API is rate limited, so the calls are synchronized not more often than once per interval.
// Both times are 'YYYY-MM-DD HH:mm:ss' strings.
export const isTimeToSyncCalls = (
  lastSyncTime: string | null,
  currentTime: string,
  intervalSeconds = SYNC_INTERVAL_SECONDS,
) => {
  const diffSeconds = Math.max(0, moment(currentTime, TIME_FORMAT).diff(moment(lastSyncTime, TIME_FORMAT), 'seconds'));
  return diffSeconds > intervalSeconds || diffSeconds === 0;
};

// A stored call keeps a snapshot of the caller: later changes of the gate user must not rewrite the history
export const toStoredCall = (call: IncomingCall, caller: GateUser | null): CallToStore => ({
  number: call.number,
  time: call.time,
  callerName: caller?.name || UNREGISTERED_CALLER_NAME,
  carNumber: caller?.carNumber,
  apartmentNumber: caller?.apartmentNumber,
  image: caller?.image,
  isBlackListed: caller?.isBlackListed || false,
  blackListedFrom: caller?.blackListedFrom || '',
  blackListedTo: caller?.blackListedTo || '',
  secondsFullTime: call.secondsFullTime,
  cause: call.cause,
  state: call.state,
});

type Dependencies = {
  source: CallsSource
  calls: CallsRepository
  gateUsers: GateUsersRepository
  // current time in the format and the time zone in which the last sync time is stored
  currentSyncTime: () => string
}

export const createSyncCalls = ({ source, calls, gateUsers, currentSyncTime }: Dependencies) =>
  async (from: string, to: string): Promise<void> => {
    const incomingCalls = await source.getCalls(from, to);

    const lastCall = await calls.findLast();
    const lastCallTime = lastCall ? new Date(lastCall.time).getTime() : 0;

    const newCalls = incomingCalls.filter(call => new Date(call.time).getTime() > lastCallTime);

    for (const call of newCalls) {
      if (await calls.exists(call.number, call.time)) continue;

      const caller = await gateUsers.findByPhoneNumber(call.number);
      await calls.add(toStoredCall(call, caller), caller?.id);
    }

    await calls.setLastSyncTime(currentSyncTime());
  };

type RefreshDependencies = {
  calls: CallsRepository
  syncCalls: (from: string, to: string) => Promise<void>
  // current time comparable with the stored last sync time
  currentTime: () => string
}

// Synchronizes the calls only when the rate limit interval has passed
export const createRefreshCalls = ({ calls, syncCalls, currentTime }: RefreshDependencies) =>
  async (from: string, to: string): Promise<void> => {
    const lastSyncTime = await calls.getLastSyncTime();

    if (isTimeToSyncCalls(lastSyncTime, currentTime())) {
      await syncCalls(from, to);
    }
  };
