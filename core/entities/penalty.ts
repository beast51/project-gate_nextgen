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
  // the ready-made ground the operator chose, and what they wrote; null for penalties from the time before them
  ground: PenaltyGround | null
  comment: string | null
  // what the apartment had done by the moment of the penalty; null when it could not be counted
  reason: PenaltyReason | null
  // null: still in force
  // `ground`, `comment`: why it was lifted
  lifted: { at: string, how: PenaltyLift, ground: PenaltyLiftGround | null, comment: string | null } | null
  source: PenaltySource
}

// What a penalty was imposed for: the violations of the apartment since its previous penalty ended (every
// violation belongs to one penalty), as the rules saw them at that moment. A snapshot: later changes
// of the rules or of the calls do not rewrite it.
export type PenaltyReason = {
  // 'YYYY-MM-DD HH:mm:ss', the violations are counted from this moment to the start of the penalty
  since: string
  overstays: number
  openVisits: number
  // how long the overstayed visits lasted, in full
  overstayMinutes: number
  // the part of them above the limit: a visit of 89 minutes with the limit of 45 gives 44
  minutesOverLimit: number
}

// Ready-made grounds of a penalty. Codes, not words: the interface translates them.
//  cheater     gets in by tricks (another phone, another car, somebody's pass)
//  tailgating  drives in right behind another car without calling ("a train")
//  overstay    stayed longer than the limit allows
export const PENALTY_GROUNDS = ['cheater', 'tailgating', 'overstay'] as const;

export type PenaltyGround = typeof PENALTY_GROUNDS[number]

// ... and of lifting one:
//  pleaded            asked very much
//  rarelyViolates     almost never breaks the rules
//  recruitmentOffice  the car is needed because of the military recruitment office
//  delivery           a delivery has to get in
//  termExpired        the term of the penalty is over (the only ground once it is; the application uses it too)
export const PENALTY_LIFT_GROUNDS = ['pleaded', 'rarelyViolates', 'recruitmentOffice', 'delivery', 'termExpired'] as const;

export type PenaltyLiftGround = typeof PENALTY_LIFT_GROUNDS[number]

export const isPenaltyGround = (value: unknown): value is PenaltyGround =>
  (PENALTY_GROUNDS as readonly unknown[]).includes(value);

export const isPenaltyLiftGround = (value: unknown): value is PenaltyLiftGround =>
  (PENALTY_LIFT_GROUNDS as readonly unknown[]).includes(value);

// what an operator says about a penalty when imposing or lifting it; the ground is checked against the right list
export type PenaltyNote = { ground?: string | null, comment?: string | null }

export const PENALTY_COMMENT_MAX_LENGTH = 500;

// violations older than this are not the reason of a new penalty
export const PENALTY_REASON_MAX_DAYS = 92;

// by an operator before the term, or by the application when the term was over
export type PenaltyLift = 'manually' | 'expired'

// 'restoredFromCalls': found in the "blocked from .. until" notes the calls keep, from the time before penalties
// were recorded. 'restoredFromRefusals': no call of that penalty got the note (the calls were loaded after it was
// lifted), but the gate refused the phone; `from` and `until` are the first and the last refusal, so the real
// term was at least that long.
export type PenaltySource = 'recorded' | 'restoredFromCalls' | 'restoredFromRefusals'

export type NewPenalty = Omit<Penalty, 'id'>

// Phones of one apartment are blocked within seconds of each other. Blocks of one apartment
// that start within this window are one penalty.
export const PENALTY_MERGE_WINDOW_MINUTES = 30;

export const penaltySubjectKeyOf = (user: Pick<GateUser, 'apartmentNumber' | 'phoneNumber'>) =>
  user.apartmentNumber || user.phoneNumber;
