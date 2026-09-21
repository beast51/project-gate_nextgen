// Both borders are 'YYYY-MM-DD HH:mm:ss'
export type PeriodQuery = {
  from: string
  to: string
}

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
  cause: number | null
  state: string | null
}

// GET /api/calls — the newest first
export type CallsResponse = CallDto[]
