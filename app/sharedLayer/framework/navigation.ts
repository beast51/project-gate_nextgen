'use client';

import { useMemo } from 'react';
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

export type AppRouter = {
  push: (href: string) => void
  // renders the current server rendered page again with fresh data
  refresh: () => void
}

export const useRouter = (): AppRouter => {
  const router = useNextRouter();

  return useMemo(() => ({
    push: (href: string) => router.push(href),
    refresh: () => router.refresh(),
  }), [router]);
};

export const usePathname = (): string => useNextPathname();

export type QueryParams = {
  get: (name: string) => string | null
}

export const useSearchParams = (): QueryParams => useNextSearchParams();
