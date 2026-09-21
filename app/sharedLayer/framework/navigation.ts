'use client';

import { useMemo } from 'react';
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

export type AppRouter = {
  push: (href: string) => void
  // the same without a new entry of the browser history
  replace: (href: string) => void
  // renders the current server rendered page again with fresh data
  refresh: () => void
}

export const useRouter = (): AppRouter => {
  const router = useNextRouter();

  return useMemo(() => ({
    push: (href: string) => router.push(href),
    replace: (href: string) => router.replace(href),
    refresh: () => router.refresh(),
  }), [router]);
};

export const usePathname = (): string => useNextPathname();

export type QueryParams = {
  get: (name: string) => string | null
  toString: () => string
}

// Changes the query of the current address without a navigation: nothing is requested from the server,
// useSearchParams() of every component sees the new value. For state that changes while typing.
// (Next.js syncs the native History API with its router, see "Native History API" in its docs.)
export const replaceQuery = (query: string) => {
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
};

export const useSearchParams = (): QueryParams => useNextSearchParams();
