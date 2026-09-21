'use client';

import { createApiClient } from './createApiClient';

// API client of the browser: same origin, the session cookie is sent by the browser itself.
export const api = createApiClient({
  fetch: (...args) => fetch(...args),
  // the sign in form lives on the start page
  onUnauthorized: () => window.location.assign('/'),
});
