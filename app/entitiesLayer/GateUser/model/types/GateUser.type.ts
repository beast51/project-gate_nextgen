import { GateUser, NewGateUser } from '@/core/entities/gateUser';

export type { GateUser, NewGateUser };

// Shape of a gate user in API responses and in the UI.
// The domain entity calls the telephony id `externalId`, the wire format keeps the historical `idInApi`.
export type GateUserType = Omit<GateUser, 'externalId'> & { idInApi: string }

export type GateUserCardProps = {
  data: GateUserType;
}

export type GateUserCardsListType = {
  users: GateUserType[]
}

export type Contact = {
  address: string
  email: string
  id: number
  name: string
  note: string
  phones: string[]
  responsible: number | null
}
export type GateUsersFromApiType = {
  contacts: Contact[]
  count: number
  limit: number
  offset: number
  users: {
    [key: number]: string
  }
}

export type ApiGateUsersType = {
  addGateUserToApi: (body: NewGateUser) => Promise<void>
  deleteGateUserFromApi: (id: string) => Promise<void>
  editGateUserOnApi: (body: NewGateUser & {
    id: string;
    isBlackListed: boolean;
}) => Promise<void>
  getGateUsersFromApi: (phoneNumber?: string, name?: string, isDemo?: boolean) => Promise<GateUserType[]>
}
export type DatabaseGateUsersProviderType = {
  addGateUsersToDatabase: (users: GateUserType[]) => Promise<void>
  deleteGateUserFromDb: (phoneNumber: string) => Promise<void>
  editGateUserInDb: (data: GateUserType) => Promise<void>
  getGateUserFromDb: (phoneNumber?: string) => Promise<GateUserType[] | undefined>
}
