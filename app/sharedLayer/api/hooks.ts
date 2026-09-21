'use client';

import useSWR, { useSWRConfig } from 'swr';
import { GateUsersQuery, GateUsersResponse, PeriodQuery } from '@/contracts';
import { apiKeys, isKeyOf } from './apiKeys';
import { api } from './browserApi';

// the server asks the telephony not more often than once per 5 seconds, more frequent requests are useless
const TELEPHONY_BACKED = { dedupingInterval: 5000 };

export const useCalls = (period: PeriodQuery) =>
  useSWR(apiKeys.calls(period), () => api.getCalls(period), TELEPHONY_BACKED);

export const useViolations = (period: PeriodQuery) =>
  useSWR(apiKeys.violations(period), () => api.getViolations(period), TELEPHONY_BACKED);

// `initial` is the list a server rendered page already has: the first paint needs no request
export const useGateUsers = (query: GateUsersQuery = {}, initial?: GateUsersResponse) =>
  useSWR(apiKeys.gateUsers(query), () => api.getGateUsers(query), {
    fallbackData: initial,
    revalidateOnMount: initial === undefined,
  });

// After a gate user was added, edited, blocked or removed: every list of gate users reloads
export const useRefreshGateUsers = () => {
  const { mutate } = useSWRConfig();
  return () => mutate(isKeyOf('gateUsers'));
};
