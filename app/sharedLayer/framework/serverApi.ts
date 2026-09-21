import { headers } from 'next/headers';
import { createApiClient } from '../api/createApiClient';

// API client for server rendered pages. A page gets its data the same way a browser does, over HTTP,
// so the front end never imports back-end code. The request goes to the origin the visitor came to
// and carries the cookies of the visitor, the API decides what this visitor may see.
//
// Next specific on purpose: with another framework only this file is rewritten.

const SAFE_HOST = /^[a-zA-Z0-9.-]+(:\d+)?$/;

export const requestOrigin = (get: (name: string) => string | null) => {
  const host = get('x-forwarded-host') || get('host') || '';

  if (!SAFE_HOST.test(host)) {
    throw new Error('Can not determine the origin of the request');
  }

  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const protocol = get('x-forwarded-proto')?.split(',')[0].trim() || (isLocal ? 'http' : 'https');

  return `${protocol}://${host}`;
};

export const getServerApi = () => {
  const incoming = headers();

  return createApiClient({
    fetch: (...args) => fetch(...args),
    baseUrl: requestOrigin(name => incoming.get(name)),
    headers: () => ({ cookie: incoming.get('cookie') || '' }),
  });
};
