import { Call, CallToStore, UNREGISTERED_CALLER_NAME } from '../../entities/call';
import { CallsRepository } from '../../ports/callsRepository';

// In-memory CallsRepository with the same filtering rules as the real storage
export const createFakeCallsRepository = (stored: Call[] = [], lastSyncTime: string | null = null) => {
  const state = {
    calls: [...stored] as (Call | CallToStore)[],
    links: [] as (string | undefined)[],
    lastSyncTime,
  };

  const inRange = (from: string, to: string) =>
    (state.calls as Call[]).filter(call => call.time >= from && call.time <= to);

  const repository: CallsRepository = {
    findByTimeRange: async (from, to) => inRange(from, to),
    findGatePassagesByTimeRange: async (from, to, failedCauses) =>
      inRange(from, to).filter(call =>
        call.callerName !== UNREGISTERED_CALLER_NAME &&
        call.isBlackListed === false &&
        (call.cause === null || call.cause === undefined || !failedCauses.includes(call.cause))
      ),
    findLast: async () =>
      ([...state.calls] as Call[]).sort((a, b) => b.time.localeCompare(a.time))[0] ?? null,
    exists: async (number, time) => state.calls.some(call => call.number === number && call.time === time),
    add: async (call, gateUserId) => {
      state.calls.push(call);
      state.links.push(gateUserId);
    },
    getLastSyncTime: async () => state.lastSyncTime,
    setLastSyncTime: async (time) => { state.lastSyncTime = time; },
  };

  return { repository, state };
};
