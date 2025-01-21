import { Prisma } from '@prisma/client';
import { BodyType } from "@/appLayer/api/users/add_user/route";

type GateUser = Omit<Prisma.GateUserGroupByOutputType, '_count' | '_min' | '_max'>
type RequiredFields = Omit<GateUser, 'image' | 'additionalImages' | 'id'>
type OptionalFields = Partial<Pick<GateUser, 'image' | 'additionalImages' | 'id'>>
type GateUserBase = RequiredFields & OptionalFields

export type GateUserType = {
  [K in keyof GateUserBase]: GateUserBase[K];
}

export type GateUserCardProps = {
  data: GateUserType;
}

export type GateUserCardsListType = {
  users: GateUserType[]
}

export type apiGateUsersType = {
  name?: string
  phoneNumber: string
  carNumber: string
  apartmentNumber: string
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

export type getGateUsersFromApiType = (phoneNumber?: string, name?: string, isDemo?: boolean) => Promise<GateUserType[]>

export type ApiGateUsersType = {
  addGateUserToApi: (body: BodyType) => Promise<void>
  deleteGateUserFromApi: (id: string) => Promise<void>
  editGateUserOnApi: (body: BodyType & {
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