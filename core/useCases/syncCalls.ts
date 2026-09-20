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

type Dependencies = {
  source: CallsSource
  calls: CallsRepository
  gateUsers: GateUsersRepository
}

export const createSyncCalls = ({ source, calls, gateUsers }: Dependencies) =>
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
