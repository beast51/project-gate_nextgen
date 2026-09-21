import type { ActivityActorDto } from './activity';

export type AccessEventKindDto = 'signIn' | 'pageView'

// A sign in or an opened page. The records are kept for 30 days.
export type AccessEventDto = {
  id: string
  // ISO 8601, UTC
  at: string
  actor: ActivityActorDto
  kind: AccessEventKindDto
  // the page without the locale prefix and the query; null for a sign in
  path: string | null
  // as the server saw them, never reported by the browser itself
  ip: string | null
  device: string | null
}

// POST /api/access/page-views — every signed in account reports the page it has opened
export type PageViewRequest = {
  // location.pathname
  path: string
}

// GET /api/access — the newest first; 403 for accounts that may not read the journals
export type AccessQuery = {
  // without a period: 30 by default; with a period: everything that happened in it; 200 at most
  limit?: number
  // a period, both borders ISO 8601 and inclusive
  from?: string
  to?: string
  actor?: string
}
export type AccessResponse = AccessEventDto[]

// GET /api/access/actors
export type AccessActorsResponse = ActivityActorDto[]
