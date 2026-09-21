import { ActivityActor } from './activity';

export type AccessEventKind = 'signIn' | 'pageView'

export const ACCESS_EVENT_KINDS: readonly AccessEventKind[] = ['signIn', 'pageView'];

// What the server knows about the browser of a request. It is never taken from the body of a request.
export type ClientInfo = {
  ip: string | null
  // a short description like "Chrome · Windows"
  device: string | null
}

// When an account signed in and which pages it opened
export type AccessEvent = {
  id: string
  // ISO 8601, UTC
  at: string
  actor: ActivityActor
  kind: AccessEventKind
  // the opened page without the locale prefix and the query; null for a sign in
  path: string | null
  ip: string | null
  device: string | null
}

export type NewAccessEvent = Omit<AccessEvent, 'id'>

// how long the records are kept, days
export const ACCESS_LOG_RETENTION_DAYS = 30;

const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/Android/, 'Android'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

// "Chrome · Windows" instead of a 150 character user agent string
export const describeDevice = (userAgent: string | null | undefined): string | null => {
  if (!userAgent) return null;

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];

  return [browser, system].filter(Boolean).join(' · ') || null;
};

const MAX_PATH_LENGTH = 200;

// The page as the journal keeps it: no locale prefix, no query, no fragment.
// Returns null for anything that is not a path of the application.
export const normalizePagePath = (path: unknown, locales: readonly string[]): string | null => {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return null;

  const [pathname] = path.split(/[?#]/);
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && locales.includes(segments[0])) segments.shift();

  return `/${segments.join('/')}`.slice(0, MAX_PATH_LENGTH);
};
