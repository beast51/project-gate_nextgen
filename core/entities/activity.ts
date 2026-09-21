import { GateUser } from './gateUser';

// Who did it: an account, or the application itself for scheduled jobs
export type ActivityActor = {
  id: string
  name: string
}

export const SYSTEM_ACTOR: ActivityActor = { id: 'system', name: 'system' };

export type ActivityAction =
  | 'gateUserAdded'
  | 'gateUserRemoved'
  | 'gateUserBlocked'
  | 'gateUserUnblocked'
  | 'gateUserChanged'
  | 'expiredPenaltiesUnblocked'
  | 'gateUsersImported'
  | 'gateUsersSyncedFromDirectory'

export const ACTIVITY_ACTIONS: readonly ActivityAction[] = [
  'gateUserAdded', 'gateUserRemoved', 'gateUserBlocked', 'gateUserUnblocked', 'gateUserChanged',
  'expiredPenaltiesUnblocked', 'gateUsersImported', 'gateUsersSyncedFromDirectory',
];

// A gate user as it was at the moment of the action: the record stays readable after the user is removed
export type ActivitySubject = Pick<GateUser, 'phoneNumber' | 'name' | 'apartmentNumber' | 'carNumber'>

export const toActivitySubject = (user: ActivitySubject): ActivitySubject => ({
  phoneNumber: user.phoneNumber,
  name: user.name,
  apartmentNumber: user.apartmentNumber,
  carNumber: user.carNumber,
});

export type ActivityDetails = {
  // 'YYYY-MM-DD HH:mm:ss', the end of a penalty
  blockedUntil?: string
  // names of the gate user fields that were changed
  changedFields?: string[]
  // for bulk operations that do not list every user
  received?: number
  added?: number
  skipped?: number
}

export type ActivityEvent = {
  id: string
  // ISO 8601, UTC
  at: string
  actor: ActivityActor
  action: ActivityAction
  // the gate users the action was about; empty for bulk operations that only count
  subjects: ActivitySubject[]
  details: ActivityDetails
}

export type NewActivityEvent = Omit<ActivityEvent, 'id'>
