'use client';

import { useEffect } from 'react';
import { api } from '@/sharedLayer/api';
import { usePathname } from '@/sharedLayer/framework/navigation';
import { useSessionStatus } from '@/sharedLayer/framework/session';

// Renders nothing. Tells the server which page a signed in account has opened; the server decides
// whose page view it is and adds the time, the address and the device. A lost report is not an error.
export const PageViewTracker = () => {
  const pathname = usePathname();
  const isSignedIn = useSessionStatus() === 'authenticated';

  useEffect(() => {
    if (!isSignedIn || !pathname) return;

    api.reportPageView({ path: pathname }).catch(() => {});
  }, [pathname, isSignedIn]);

  return null;
};
