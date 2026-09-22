import { BlackListedGateUserDto } from '@/contracts';
import { ActivityActor } from '@/core/entities/activity';
import { BlackListedGateUser } from '@/core/useCases/listBlackListed';
import { PenaltyDto } from '@/contracts';
import { Penalty } from '@/core/entities/penalty';
import { AccessEventDto, ActivityEventDto, CallDto, GateUserDto, ViolationsResponse } from '@/contracts';
import { AccessEvent } from '@/core/entities/access';
import { ActivityEvent } from '@/core/entities/activity';
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

type DisplayName = (who: ActivityActor | null) => string | null

export const toBlackListedGateUserDto = (displayNameOf: DisplayName) => ({ penalty, ...user }: BlackListedGateUser): BlackListedGateUserDto => ({
  ...toGateUserDto(user),
  penalty: penalty && (penalty.ground || penalty.comment || penalty.imposedBy)
    ? { ground: penalty.ground, comment: penalty.comment, imposedBy: displayNameOf(penalty.imposedBy) }
    : null,
});

export const fromGateUserDto = ({ idInApi, ...dto }: GateUserDto): GateUser => ({
  ...dto,
  externalId: idInApi,
});

export const toCallDto = (call: Call): CallDto => call;

export const toPenaltyDto = (displayNameOf: DisplayName) => (penalty: Penalty): PenaltyDto => ({
  id: penalty.id,
  phoneNumbers: penalty.phoneNumbers,
  from: penalty.from,
  until: penalty.until,
  // the name only: who the account is stays on the server
  imposedBy: displayNameOf(penalty.imposedBy),
  ground: penalty.ground,
  comment: penalty.comment,
  reason: penalty.reason,
  lifted: penalty.lifted,
  isRecorded: penalty.source === 'recorded',
});

export const toAccessEventDto = (event: AccessEvent): AccessEventDto => event;

export const toActivityEventDto = (event: ActivityEvent): ActivityEventDto => event;

export const toViolationsResponse = (visits: VisitsOutput): ViolationsResponse =>
  Object.fromEntries(Object.entries(visits).map(([key, details]) => [key, {
    ...details,
    visits: details.visits.map(visit => ({
      ...visit,
      timeOut: visit.timeOut === null ? null : String(visit.timeOut),
    })),
  }]));
