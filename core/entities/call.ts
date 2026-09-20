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
  cause: number | null
  state: string | null
}

// Raw call received from the telephony, before it is matched with a gate user
export type IncomingCall = {
  number: string
  time: string
  secondsFullTime?: number
  cause?: number | null
  state?: string | null
}

export const UNREGISTERED_CALLER_NAME = 'Not registered';

// Q.850 release causes which mean that the call failed and the gate did not open
export const FAILED_CALL_CAUSES: readonly number[] = [31, 38];
