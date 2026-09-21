'use client';

import useSWR, { useSWRConfig } from 'swr';
import {
  AccessQuery, ActivityQuery, GateUserDto, GateUsersQuery, GateUsersResponse, PeriodQuery, ViolationStatsQuery,
} from '@/contracts';
import { apiKeys, isKeyOf } from './apiKeys';
import { api } from './browserApi';
import { blackListWithChangedGateUser, withChangedGateUser, withoutGateUser } from './gateUsersCache';

// the server asks the telephony not more often than once per 5 seconds, more frequent requests are useless
const TELEPHONY_BACKED = { dedupingInterval: 5000 };

export const useCalls = (period: PeriodQuery) =>
  useSWR(apiKeys.calls(period), () => api.getCalls(period), TELEPHONY_BACKED);

export const useViolations = (period: PeriodQuery) =>
  useSWR(apiKeys.violations(period), () => api.getViolations(period), TELEPHONY_BACKED);

// Three months of history change slowly and cost a heavy query: asked once per day chosen in the calendar,
// not on every focus of the window. null: the day is not known yet, nothing is requested.
const SLOW_HISTORY = { dedupingInterval: 5 * 60 * 1000, revalidateOnFocus: false, keepPreviousData: true };

export const useViolationStats = (query: ViolationStatsQuery | null) =>
  useSWR(query && apiKeys.violationStats(query), () => api.getViolationStats(query!), SLOW_HISTORY);

// `initial` is the list a server rendered page already has, so the first paint needs no request.
// The list is still confirmed by the server after mounting: the page may come from the router cache
// of the browser, and only a fetched list gets into the SWR cache where later changes can reach it.
export const useGateUsers = (query: GateUsersQuery = {}, initial?: GateUsersResponse) =>
  useSWR(apiKeys.gateUsers(query), () => api.getGateUsers(query), {
    fallbackData: initial,
    revalidateOnMount: true,
  });

// The journal of actions. An account that may not read it gets an ApiError with status 403.
const NO_RETRY_WHEN_FORBIDDEN = { shouldRetryOnError: false };

export const useActivity = (query: ActivityQuery = {}) =>
  useSWR(apiKeys.activity(query), () => api.getActivity(query), NO_RETRY_WHEN_FORBIDDEN);

export const useActivityActors = () =>
  useSWR(apiKeys.activityActors(), () => api.getActivityActors(), NO_RETRY_WHEN_FORBIDDEN);

// Sign ins and opened pages, for admins only like the journal of actions
export const useAccessLog = (query: AccessQuery = {}) =>
  useSWR(apiKeys.access(query), () => api.getAccessLog(query), NO_RETRY_WHEN_FORBIDDEN);

export const useAccessActors = () =>
  useSWR(apiKeys.accessActors(), () => api.getAccessActors(), NO_RETRY_WHEN_FORBIDDEN);

// Keeps every cached list of gate users in step with a change made anywhere in the application.
// A list that is on the screen reloads at once, a list that is not reloads when it is opened.
export const useGateUsersCache = () => {
  const { mutate } = useSWRConfig();

  const all = apiKeys.gateUsers();
  const blackList = apiKeys.gateUsers({ blackListed: true });

  return {
    // something changed, the details are unknown (a user was added, penalties were unblocked in bulk)
    refresh: () => Promise.all([mutate(isKeyOf('gateUsers')), mutate(isKeyOf('activity'))]),

    removed: (phoneNumber: string) => Promise.all([
      mutate(all, (list?: GateUserDto[]) => withoutGateUser(list, phoneNumber)),
      mutate(blackList, (list?: GateUserDto[]) => withoutGateUser(list, phoneNumber)),
      mutate(apiKeys.gateUsers({ phoneNumber }), []),
      mutate(isKeyOf('activity')),
    ]),

    changed: (user: GateUserDto) => Promise.all([
      mutate(all, (list?: GateUserDto[]) => withChangedGateUser(list, user)),
      mutate(blackList, (list?: GateUserDto[]) => blackListWithChangedGateUser(list, user)),
      mutate(isKeyOf('activity')),
    ]),
  };
};
