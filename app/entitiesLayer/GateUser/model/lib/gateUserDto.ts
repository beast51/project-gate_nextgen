import { GateUser } from '@/core/entities/gateUser';
import { GateUserType } from '../types/GateUser.type';

// The wire format keeps the historical `idInApi`, the domain entity calls it `externalId`
export const toGateUserDto = ({ externalId, ...user }: GateUser): GateUserType => ({
  ...user,
  idInApi: externalId,
});

export const fromGateUserDto = ({ idInApi, ...dto }: GateUserType): GateUser => ({
  ...dto,
  externalId: idInApi,
});
