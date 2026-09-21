import { ActivityActor } from './activity';
import { GateUser } from './gateUser';

// A penalty: the residents of an apartment lose the right to open the gate for a while.
// It is a fact about the APARTMENT: the staff blocks all its phones, one after another. A caller
// without an apartment is punished alone. The record outlives the gate users it was about.
export type Penalty = {
  id: string
  // the apartment number or, without an apartment, the phone number: the same key the violations are counted by
  subjectKey: string
  apartmentNumber: string | null
  // the phones that were blocked by this penalty
  phoneNumbers: string[]
  // 'YYYY-MM-DD HH:mm:ss', the local time of the gate, like the times of the calls
  from: string
  until: string
  // null: nobody knows any more (restored from old data)
  imposedBy: ActivityActor | null
  // null: still in force
  lifted: { at: string, how: PenaltyLift } | null
  source: PenaltySource
}

// by an operator before the term, or by the application when the term was over
export type PenaltyLift = 'manually' | 'expired'

// 'restoredFromCalls': found in the snapshots the calls keep, from the time before penalties were recorded
export type PenaltySource = 'recorded' | 'restoredFromCalls'

export type NewPenalty = Omit<Penalty, 'id'>

// Phones of one apartment are blocked within seconds of each other. Blocks of one apartment
// that start within this window are one penalty.
export const PENALTY_MERGE_WINDOW_MINUTES = 30;

export const penaltySubjectKeyOf = (user: Pick<GateUser, 'apartmentNumber' | 'phoneNumber'>) =>
  user.apartmentNumber || user.phoneNumber;
