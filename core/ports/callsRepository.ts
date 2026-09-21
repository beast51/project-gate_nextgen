import { Call, CallToStore, PassageCall } from '../entities/call';

// Storage of the calls that were already matched with gate users
export type CallsRepository = {
  findByTimeRange: (from: string, to: string) => Promise<Call[]>
  // the same period in the light form the rules of violations need: months of calls are read this way
  findPassagesByTimeRange: (from: string, to: string) => Promise<PassageCall[]>
  // the same for one apartment or, for a caller without an apartment, one phone number
  findPassagesOfSubject: (subjectKey: string, from: string, to: string) => Promise<PassageCall[]>
  findLast: () => Promise<Call | null>
  // stores all calls with one request; fails as a whole, the next synchronization retries
  addMany: (calls: { call: CallToStore, gateUserId?: string }[]) => Promise<void>
  // Rate limit guard of the telephony API, shared by all users of the storage.
  // Atomically marks `now` as the time of the last synchronization when at least `minIntervalSeconds`
  // have passed since the previous one. Only the caller that gets `true` may go to the telephony.
  claimSync: (now: Date, minIntervalSeconds: number) => Promise<boolean>
  // Days ('YYYY-MM-DD') whose calls were loaded from the telephony after the day was over. Such a day is
  // complete: it is read from the storage and the telephony is not asked about it again.
  listFilledDays: (fromDay: string, toDay: string) => Promise<string[]>
  markDaysFilled: (days: string[], at: Date) => Promise<void>
  // The owner of the slot restarts the interval, so nobody else starts a synchronization while it is still writing
  extendSync: (now: Date) => Promise<void>
}
