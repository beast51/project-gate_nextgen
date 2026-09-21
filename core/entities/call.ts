// What a call to the gate ended with, in terms of the gate, not of a telephony provider.
// Every provider adapter translates its own codes into these values.
export type CallOutcome =
  | 'opened'
  | 'openedAfterLongWait'
  | 'openedRouteUnavailable'
  | 'connectionFailed'
  | 'operatorError'
  // the provider reported nothing, or something the adapter does not know
  | 'unknown'

export const CALL_OUTCOMES: readonly CallOutcome[] = [
  'opened', 'openedAfterLongWait', 'openedRouteUnavailable', 'connectionFailed', 'operatorError', 'unknown',
];

// The call never reached the gate. An unknown outcome is not a failure: the gate is assumed to have opened.
export const isFailedOutcome = (outcome: CallOutcome) =>
  outcome === 'connectionFailed' || outcome === 'operatorError';

// Call that has already been matched with a gate user
export type Call = {
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
  outcome: CallOutcome
  // Raw codes of the telephony provider, kept for diagnostics only. The core never interprets them.
  cause: number | null
  state: string | null
}

// Raw call received from the telephony, before it is matched with a gate user
export type IncomingCall = {
  number: string
  time: string
  secondsFullTime?: number
  outcome: CallOutcome
  cause?: number | null
  state?: string | null
}

// A call on its way to the storage: what the telephony did not report stays unset
export type CallToStore = Pick<Call, 'number' | 'time' | 'callerName' | 'outcome'> & Partial<Call>

export const UNREGISTERED_CALLER_NAME = 'Not registered';
