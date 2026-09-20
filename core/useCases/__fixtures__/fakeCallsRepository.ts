import { Call, CallToStore, UNREGISTERED_CALLER_NAME } from '../../entities/call';
import { CallsRepository } from '../../ports/callsRepository';

// In-memory CallsRepository with the same filtering rules as the real storage
export const createFakeCallsRepository = (stored: Call[] = [], lastSyncTime: Date | null = null) => {
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
    addMany: async (calls) => {
      calls.forEach(({ call, gateUserId }) => {
        state.calls.push(call);
        state.links.push(gateUserId);
      });
    },
    claimSync: async (now, minIntervalSeconds) => {
      const allowed = !state.lastSyncTime ||
        now.getTime() - state.lastSyncTime.getTime() > minIntervalSeconds * 1000;
      if (allowed) state.lastSyncTime = now;
      return allowed;
    },
    extendSync: async (now) => { state.lastSyncTime = now; },
  };

  return { repository, state };
};
