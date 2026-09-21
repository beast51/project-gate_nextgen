// Both borders are 'YYYY-MM-DD HH:mm:ss'
export type PeriodQuery = {
  from: string
  to: string
}

// What the call ended with, in terms of the gate. It does not depend on the telephony provider.
export type CallOutcomeDto =
  | 'opened'
  | 'openedAfterLongWait'
  | 'openedRouteUnavailable'
  | 'connectionFailed'
  | 'operatorError'
  | 'unknown'

// the call did not reach the gate
export const FAILED_CALL_OUTCOMES: readonly CallOutcomeDto[] = ['connectionFailed', 'operatorError'];

// A call to the gate with a snapshot of the caller at the moment of the call
export type CallDto = {
  number: string
  time: string
  carNumber: string[]
  callerName: string | null
  apartmentNumber: string | null
  image: string | null
  isBlackListed?: boolean | null
  blackListedFrom: string | null
  blackListedTo: string | null
  secondsFullTime: number | null
  outcome: CallOutcomeDto
  // raw codes of the telephony provider, for diagnostics only: their meaning differs between providers
  cause: number | null
  state: string | null
}

// GET /api/calls — the newest first
export type CallsResponse = CallDto[]
