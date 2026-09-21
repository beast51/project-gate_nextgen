import { Call, CallToStore } from '../../entities/call';
import { CallsRepository } from '../../ports/callsRepository';

// In-memory CallsRepository
export const createFakeCallsRepository = (stored: Call[] = [], lastSyncTime: Date | null = null) => {
  const state = {
    calls: [...stored] as (Call | CallToStore)[],
    links: [] as (string | undefined)[],
    lastSyncTime,
    filledDays: new Set<string>(),
  };

  const inRange = (from: string, to: string) =>
    (state.calls as Call[]).filter(call => call.time >= from && call.time <= to);

  const repository: CallsRepository = {
    findByTimeRange: async (from, to) => inRange(from, to),
    findPassagesByTimeRange: async (from, to) => inRange(from, to),
    findPassagesOfSubject: async (subjectKey, from, to) =>
      inRange(from, to).filter(call => (call.apartmentNumber || call.number) === subjectKey),
    listFilledDays: async (fromDay, toDay) =>
      Array.from(state.filledDays).filter(day => day >= fromDay && day <= toDay).sort(),
    markDaysFilled: async (days) => { days.forEach(day => state.filledDays.add(day)); },
    findPenaltySnapshots: async (since) => (state.calls as Call[])
      .filter(call => call.isBlackListed && call.blackListedFrom && call.blackListedFrom >= since)
      .map(call => ({
        number: call.number,
        apartmentNumber: call.apartmentNumber ?? null,
        blackListedFrom: call.blackListedFrom ?? '',
        blackListedTo: call.blackListedTo ?? '',
      })),
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
