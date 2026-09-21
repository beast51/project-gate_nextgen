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

// POST /api/violations/unblock_expired_penalties_users
export type UnblockExpiredPenaltiesResponse = { message: string }
