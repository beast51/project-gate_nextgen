import { CallDto, GateUserDto, ViolationsResponse } from '@/contracts';
import { Call } from '@/core/entities/call';
import { GateUser } from '@/core/entities/gateUser';
import { VisitsOutput } from '@/core/entities/violation';

// The border between the domain and the HTTP contract. The contract is frozen for the clients,
// the domain is free to change: every difference between them lives here.

// the contract keeps the historical `idInApi`, the domain calls it `externalId`
export const toGateUserDto = ({ externalId, ...user }: GateUser): GateUserDto => ({
  ...user,
  idInApi: externalId,
});

export const fromGateUserDto = ({ idInApi, ...dto }: GateUserDto): GateUser => ({
  ...dto,
  externalId: idInApi,
});

export const toCallDto = (call: Call): CallDto => call;

export const toViolationsResponse = (visits: VisitsOutput): ViolationsResponse =>
  Object.fromEntries(Object.entries(visits).map(([key, details]) => [key, {
    ...details,
    visits: details.visits.map(visit => ({
      ...visit,
      timeOut: visit.timeOut === null ? null : String(visit.timeOut),
    })),
  }]));
