import { GateUser, NewGateUser } from '../entities/gateUser';

// What the telephony knows about a person: there are no images and no penalty dates there
export type DirectoryEntry = Pick<
  GateUser,
  'externalId' | 'name' | 'phoneNumber' | 'carNumber' | 'apartmentNumber' | 'isBlackListed'
>

export type DirectoryEntryChanges = {
  externalId: string
  name: string
  phoneNumber: string
  carNumber: string[]
  apartmentNumber: string
  // a black listed person stays in the directory but the gate does not open for them
  isBlackListed: boolean
}

// Directory of the telephony provider: the gate opens only for the numbers listed there
export type GateUsersDirectory = {
  find: (filter?: { phoneNumber?: string, name?: string }) => Promise<DirectoryEntry[]>
  add: (user: NewGateUser) => Promise<void>
  update: (changes: DirectoryEntryChanges) => Promise<void>
  remove: (externalId: string) => Promise<void>
}
