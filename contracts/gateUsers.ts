// A person who may open the gate by a phone call, as the HTTP API shows it
export type GateUserDto = {
  id?: string
  // id of the same person at the telephony provider (historical field name)
  idInApi: string
  name: string
  phoneNumber: string
  carNumber: string[]
  apartmentNumber: string | null
  image?: string | null
  additionalImages?: string[]
  isBlackListed: boolean
  // 'YYYY-MM-DD HH:mm:ss' or an empty string
  blackListedFrom: string
  blackListedTo: string
}

// GET /api/users
export type GateUsersQuery = {
  phoneNumber?: string
  // true: only users with a penalty, ordered by apartment
  blackListed?: boolean
}
export type GateUsersResponse = GateUserDto[]

// POST /api/users/add_user — car numbers come as one comma separated string
export type AddGateUserRequest = {
  name: string
  phoneNumber: string
  carNumber: string
  apartmentNumber: string
}

// Ready-made grounds an operator chooses from when blocking a gate user...
export const PENALTY_GROUNDS = ['cheater', 'tailgating', 'overstay'] as const;

export type PenaltyGroundDto = typeof PENALTY_GROUNDS[number]

// ... and when unblocking one. 'termExpired' is the only ground once the term of the penalty is over.
export const PENALTY_LIFT_GROUNDS = ['pleaded', 'rarelyViolates', 'recruitmentOffice', 'delivery', 'termExpired'] as const;

export type PenaltyLiftGroundDto = typeof PENALTY_LIFT_GROUNDS[number]

// what the operator says about the penalty: the chosen ground and/or their own words (up to 500 characters)
export type PenaltyNoteDto = {
  ground?: PenaltyGroundDto | PenaltyLiftGroundDto | null
  comment?: string | null
}

// POST /api/users/edit_user — the whole user; blocking and unblocking are edits of the penalty fields.
// `penaltyNote` goes with an edit that blocks or unblocks the user and is kept in the record of the penalty.
export type EditGateUserRequest = GateUserDto & { penaltyNote?: PenaltyNoteDto }

// POST /api/users/delete_user — `id` is GateUserDto.idInApi
export type DeleteGateUserRequest = {
  phoneNumber: string
  id: string
}

// POST /api/users/sync_from_directory
export type SyncGateUsersResponse =
  | { status: 'synced', found: number, added: number }
  | { status: 'skipped', reason: 'rate limit' }

// POST /api/users/import — the body is the file made by GET /api/users/export
export type ImportGateUsersRequest = GateUserDto[]
export type ImportGateUsersResponse = { received: number, added: number, skipped: number }
