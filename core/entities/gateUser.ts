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

// Letters of a Ukrainian number plate that look the same in both alphabets. A plate is stored in Latin,
// in upper case and without spaces, whatever keyboard the operator or the telephony used
// (the search normalizes what is typed the same way, see sharedLayer/lib/search)
const CYRILLIC_LOOKALIKES: Record<string, string> = {
  'А': 'A', 'В': 'B', 'Е': 'E', 'І': 'I', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'У': 'Y',
};

// "вн 1096 іс" -> "BH1096IC"
export const normalizeCarNumber = (carNumber: string) =>
  carNumber.replace(/\s/g, '').toUpperCase().replace(/[А-ЯІ]/g, letter => CYRILLIC_LOOKALIKES[letter] ?? letter);

export const parseCarNumbers = (carNumber: string) =>
  normalizeCarNumber(carNumber).split(',');
