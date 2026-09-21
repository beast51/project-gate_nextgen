import { GateUserDto } from '@/contracts';

export type GateUserType = GateUserDto

export type GateUserCardProps = {
  data: GateUserType;
}

export type GateUserCardsListType = {
  users: GateUserType[]
}
