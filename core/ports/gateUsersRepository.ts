import { GateUser } from '../entities/gateUser';

// A gate user is identified by the phone number, the other fields replace the stored ones
export type GateUserChanges = Pick<GateUser, 'phoneNumber'> & Partial<Omit<GateUser, 'phoneNumber' | 'id'>>

// Storage of gate users
export type GateUsersRepository = {
  list: (filter?: { phoneNumber?: string }) => Promise<GateUser[]>
  listBlackListed: () => Promise<GateUser[]>
  findByPhoneNumber: (phoneNumber: string) => Promise<GateUser | null>
  // users whose phone number is already stored are skipped; returns how many users were added
  addMissing: (users: GateUser[]) => Promise<number>
  update: (changes: GateUserChanges) => Promise<void>
  remove: (phoneNumber: string) => Promise<void>
  // Rate limit guard of the telephony directory, the same contract as CallsRepository.claimSync
  claimDirectorySync: (now: Date, minIntervalSeconds: number) => Promise<boolean>
}
