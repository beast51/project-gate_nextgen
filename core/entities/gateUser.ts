// A person who is allowed (or, while black listed, not allowed) to open the gate by a phone call
export type GateUser = {
  id?: string
  // id of the same person in the telephony directory
  externalId: string
  name: string
  phoneNumber: string
  carNumber: string[]
  apartmentNumber: string | null
  image?: string | null
  additionalImages?: string[]
  isBlackListed: boolean
  blackListedFrom: string
  blackListedTo: string
}

// Data entered by an operator, car numbers come as one comma separated string
export type NewGateUser = {
  name: string
  phoneNumber: string
  carNumber: string
  apartmentNumber: string
}

export const normalizeCarNumber = (carNumber: string) =>
  carNumber.split(' ').join('').toUpperCase();

export const parseCarNumbers = (carNumber: string) =>
  normalizeCarNumber(carNumber).split(',');
