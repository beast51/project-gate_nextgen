import { Call, CallToStore } from '../entities/call';

// Storage of the calls that were already matched with gate users
export type CallsRepository = {
  findByTimeRange: (from: string, to: string) => Promise<Call[]>
  // only calls that opened the gate: known, not black listed caller and no failure cause
  findGatePassagesByTimeRange: (from: string, to: string, failedCauses: readonly number[]) => Promise<Call[]>
  findLast: () => Promise<Call | null>
  exists: (number: string, time: string) => Promise<boolean>
  add: (call: CallToStore, gateUserId?: string) => Promise<void>
  // Rate limit guard of the telephony API, shared by all users of the storage.
  // Atomically marks `now` as the time of the last synchronization when at least `minIntervalSeconds`
  // have passed since the previous one. Only the caller that gets `true` may go to the telephony.
  claimSync: (now: Date, minIntervalSeconds: number) => Promise<boolean>
}
