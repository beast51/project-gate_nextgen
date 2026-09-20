import { CallToStore, IncomingCall, UNREGISTERED_CALLER_NAME } from '../entities/call';
import { GateUser } from '../entities/gateUser';
import { CallsRepository } from '../ports/callsRepository';
import { CallsSource } from '../ports/callsSource';
import { GateUsersRepository } from '../ports/gateUsersRepository';

// The telephony API is rate limited: not more than one synchronization per this number of seconds
export const DEFAULT_SYNC_INTERVAL_SECONDS = 5;

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

// one phone can not make two calls in the same second
const callKey = (call: { number: string, time: string }) => `${call.number}|${call.time}`;

type Dependencies = {
  source: CallsSource
  calls: CallsRepository
  gateUsers: GateUsersRepository
}

export const createSyncCalls = ({ source, calls, gateUsers }: Dependencies) =>
  async (from: string, to: string): Promise<void> => {
    const incomingCalls = await source.getCalls(from, to);

    if (incomingCalls.length === 0) return;

    // Calls are compared with what is already stored for the same period, not with the newest stored call:
    // a day nobody looked at is filled in whenever it is requested, even if later days are already stored.
    const times = incomingCalls.map(call => call.time).sort();
    const stored = await calls.findByTimeRange(times[0], times[times.length - 1]);
    const known = new Set(stored.map(call => callKey(call)));

    for (const call of incomingCalls) {
      if (known.has(callKey(call))) continue;
      known.add(callKey(call));

      const caller = await gateUsers.findByPhoneNumber(call.number);
      await calls.add(toStoredCall(call, caller), caller?.id);
    }
  };

type RefreshDependencies = {
  calls: CallsRepository
  syncCalls: (from: string, to: string) => Promise<void>
  minIntervalSeconds?: number
  now?: () => Date
}

// Synchronizes the calls only when the rate limit allows it. The slot is claimed before the telephony is called,
// so concurrent requests and a failed synchronization can not exceed the limit.
export const createRefreshCalls = ({
  calls,
  syncCalls,
  minIntervalSeconds = DEFAULT_SYNC_INTERVAL_SECONDS,
  now = () => new Date(),
}: RefreshDependencies) =>
  async (from: string, to: string): Promise<void> => {
    if (await calls.claimSync(now(), minIntervalSeconds)) {
      await syncCalls(from, to);
    }
  };
