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
