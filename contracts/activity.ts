export type ActivityActionDto =
  | 'gateUserAdded'
  | 'gateUserRemoved'
  | 'gateUserBlocked'
  | 'gateUserUnblocked'
  | 'gateUserChanged'
  | 'expiredPenaltiesUnblocked'
  | 'gateUsersImported'
  | 'gateUsersSyncedFromDirectory'

// an account, or { id: 'system' } for scheduled jobs
export type ActivityActorDto = {
  id: string
  name: string
}

// a gate user as it was at the moment of the action
export type ActivitySubjectDto = {
  phoneNumber: string
  name: string
  apartmentNumber: string | null
  carNumber: string[]
}

export type ActivityEventDto = {
  id: string
  // ISO 8601, UTC
  at: string
  actor: ActivityActorDto
  action: ActivityActionDto
  // empty for bulk operations that only count (import, synchronization)
  subjects: ActivitySubjectDto[]
  details: {
    // 'YYYY-MM-DD HH:mm:ss', the end of a penalty
    blockedUntil?: string
    changedFields?: string[]
    received?: number
    added?: number
    skipped?: number
  }
}

// GET /api/activity — the newest first; 403 for accounts that may not read the journal
export type ActivityQuery = {
  // 10 by default, 100 at most
  limit?: number
  // ActivityActorDto.id
  actor?: string
}
export type ActivityResponse = ActivityEventDto[]

// GET /api/activity/actors — everybody who has at least one record
export type ActivityActorsResponse = ActivityActorDto[]
