import { GateUsersQuery, PeriodQuery } from '@/contracts';

// Cache keys of SWR. A key starts with the name of the resource, so everything that belongs
// to a resource can be refreshed at once, whatever the filters are.
export const apiKeys = {
  calls: ({ from, to }: PeriodQuery) => ['calls', from, to] as const,
  violations: ({ from, to }: PeriodQuery) => ['violations', from, to] as const,
  gateUsers: ({ phoneNumber = '', blackListed = false }: GateUsersQuery = {}) =>
    ['gateUsers', phoneNumber, blackListed] as const,
};

export const isKeyOf = (resource: 'calls' | 'violations' | 'gateUsers') =>
  (key: unknown) => Array.isArray(key) && key[0] === resource;
