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

// POST /api/users/edit_user — the whole user; blocking and unblocking are edits of the penalty fields
export type EditGateUserRequest = GateUserDto

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
