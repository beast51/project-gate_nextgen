export type VisitInfo = {
  timeIn: string
  timeOut: Date | string | null
  thisVisitTime: number | null
  violationTime: number | null
  violation: string
}

// visits grouped by apartment: all phone numbers of the apartment are collected
export type ApartmentVisitor = {
  number: string[]
  carNumber: string[]
  image?: string | null
  name?: string | null
}

// visits of a caller without an apartment, grouped by phone number
export type PhoneVisitor = {
  carNumber: string[]
  image?: string | null
  apartmentNumber?: string | null
  name?: string | null
}

export type VisitDetails = {
  visitCount: number
  violationCount: number
  visits: VisitInfo[]
  aboutUser: ApartmentVisitor | PhoneVisitor
}

// key is an apartment number or, for callers without an apartment, a phone number
export type VisitsOutput = {
  [apartmentOrPhone: string]: VisitDetails
}

export type ViolationRules = {
  // how long a car may stay inside, minutes
  limitMinutes: number
  // calls of one visitor closer than this are the same passage through the gate, seconds
  secondsBetweenTwoCalls: number
  // a repeated call from the same number within this window is a redial, minutes
  pairedCallWindowMinutes: number
  failedCauses: readonly number[]
}
