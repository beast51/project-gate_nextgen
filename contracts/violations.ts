export type VisitDto = {
  timeIn: string
  timeOut: string | null
  thisVisitTime: number | null
  // minutes inside, null while the visit is open
  violationTime: number | null
  violation: string
}

export type VisitorDto = {
  carNumber: string[]
  image?: string | null
  name?: string | null
  // visits grouped by apartment: all phone numbers of the apartment
  number?: string[]
  // visits of a caller without an apartment, grouped by phone number
  apartmentNumber?: string | null
}

export type VisitsDto = {
  visitCount: number
  violationCount: number
  visits: VisitDto[]
  aboutUser: VisitorDto
}

// GET /api/violations — the key is an apartment number or, for callers without an apartment, a phone number
export type ViolationsResponse = Record<string, VisitsDto>

// Violations of one kind are counted apart: the staff reacts to them differently
export type ViolationCountsDto = {
  // stayed inside longer than the limit
  overstays: number
  // entered and did not leave until the end of the day
  openVisits: number
  // how many times the apartment was really punished: penalties (blocks) that started in the period
  penalties: number
}

export type ViolationStatsDto = {
  week: ViolationCountsDto
  month: ViolationCountsDto
  threeMonths: ViolationCountsDto
}

// inclusive, 'YYYY-MM-DD'
export type DayPeriodDto = [from: string, to: string]

export type ViolationStatsQuery = { day: string }

// GET /api/violations/stats?day=YYYY-MM-DD — violations around the chosen day: its week (Monday to Sunday),
// its calendar month, and the month with the two calendar months before it.
export type ViolationStatsResponse = {
  day: string
  periods: { week: DayPeriodDto, month: DayPeriodDto, threeMonths: DayPeriodDto }
  // the same keys as in ViolationsResponse; only those who have violations
  stats: Record<string, ViolationStatsDto>
  // finished days of the periods whose calls were never loaded: the numbers may be lower than the truth
  coverage: { pastDays: number, missingDays: string[] }
}

// One violation of an apartment (or of a caller without an apartment)
export type SubjectViolationDto = {
  // 'YYYY-MM-DD'
  day: string
  // 'YYYY-MM-DD HH:mm:ss'
  timeIn: string
  // null: no exit was seen that day
  timeOut: string | null
  // how long the visit lasted; null for a visit without an exit
  minutes: number | null
  kind: 'overstay' | 'openVisit'
}

// A penalty as the page of a resident shows it
export type PenaltyDto = {
  id: string
  phoneNumbers: string[]
  // 'YYYY-MM-DD HH:mm:ss', the local time of the gate
  from: string
  until: string
  // null: nobody knows any more (restored from old calls)
  imposedBy: string | null
  // PenaltyGroundDto, see gateUsers.ts
  ground: string | null
  comment: string | null
  // what it was for: the violations of the apartment since its previous penalty ended
  reason: { since: string, overstays: number, openVisits: number, overstayMinutes: number, minutesOverLimit: number } | null
  // null: still in force; `ground` is a PenaltyLiftGroundDto
  lifted: { at: string, how: 'manually' | 'expired', ground: string | null, comment: string | null } | null
  // false: found later in the "blocked from .. until" notes of old calls, its end is the end of the term
  isRecorded: boolean
}

export type ViolationHistoryQuery = { subject: string }

// GET /api/violations/history?subject=174 — what an apartment (or, for a caller without an apartment, a phone
// number) has done in the last three months and every penalty it has got. The newest first.
export type ViolationHistoryResponse = {
  subject: string
  period: DayPeriodDto
  violations: SubjectViolationDto[]
  penalties: PenaltyDto[]
}

// POST /api/calls/backfill — loads ONE missing day of history from the telephony. Admins only.
export type BackfillCallsRequest = { from: string, to: string }

export type BackfillCallsResponse =
  | { status: 'done' }
  | { status: 'rateLimited', remaining: number }
  | { status: 'filled', day: string, added: number, remaining: number }

// POST /api/penalties/restore — finds the penalties of the time before they were recorded (in the snapshots
// the calls keep) and, with `apply`, writes the missing ones. Admins only.
export type RestorePenaltiesRequest = { since: string, apply?: boolean }

export type RestoredPenaltyDto = {
  apartmentNumber: string | null
  phones: number
  from: string
  until: string
  inForce: boolean
  liftedAt: string | null
  liftedHow: 'manually' | 'expired' | null
  overstays: number
  openVisits: number
  overstayMinutes: number
  minutesOverLimit: number
}

export type RestorePenaltiesResponse = { blocks: number, found: number, written: number, missing: RestoredPenaltyDto[] }

// POST /api/violations/unblock_expired_penalties_users
export type UnblockExpiredPenaltiesResponse = { message: string }
