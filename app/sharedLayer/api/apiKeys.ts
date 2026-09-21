import { AccessQuery, ActivityQuery, GateUsersQuery, PeriodQuery } from '@/contracts';

// Cache keys of SWR. A key starts with the name of the resource, so everything that belongs
// to a resource can be refreshed at once, whatever the filters are.
export const apiKeys = {
  calls: ({ from, to }: PeriodQuery) => ['calls', from, to] as const,
  violations: ({ from, to }: PeriodQuery) => ['violations', from, to] as const,
  gateUsers: ({ phoneNumber = '', blackListed = false }: GateUsersQuery = {}) =>
    ['gateUsers', phoneNumber, blackListed] as const,
  activity: ({ limit = 0, actor = '', from = '', to = '' }: ActivityQuery = {}) => ['activity', limit, actor, from, to] as const,
  activityActors: () => ['activity', 'actors'] as const,
  access: ({ limit = 0, actor = '', from = '', to = '' }: AccessQuery = {}) => ['access', limit, actor, from, to] as const,
  accessActors: () => ['access', 'actors'] as const,
};

export const isKeyOf = (resource: 'calls' | 'violations' | 'gateUsers' | 'activity' | 'access') =>
  (key: unknown) => Array.isArray(key) && key[0] === resource;
