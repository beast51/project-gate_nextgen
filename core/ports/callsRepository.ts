import { Call } from '../entities/call';

// Storage of the calls that were already matched with gate users
export type CallsRepository = {
  findByTimeRange: (from: string, to: string) => Promise<Call[]>
  // only calls that opened the gate: known, not black listed caller and no failure cause
  findGatePassagesByTimeRange: (from: string, to: string, failedCauses: readonly number[]) => Promise<Call[]>
  findLast: () => Promise<Call | null>
  exists: (number: string, time: string) => Promise<boolean>
  add: (call: Call, gateUserId?: string) => Promise<void>
  getLastSyncTime: () => Promise<string | null>
  setLastSyncTime: (time: string) => Promise<void>
}
