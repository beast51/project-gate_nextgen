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
  overstays: number
  openVisits: number
  overstayMinutes: number
  minutesOverLimit: number
}

export type RestorePenaltiesResponse = { blocks: number, found: number, written: number, missing: RestoredPenaltyDto[] }

// POST /api/violations/unblock_expired_penalties_users
export type UnblockExpiredPenaltiesResponse = { message: string }
