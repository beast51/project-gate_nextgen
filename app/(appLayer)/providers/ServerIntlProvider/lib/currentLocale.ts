import { headers } from 'next/headers';
import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';

// The i18n router (proxy.ts) reports the locale of the request in this header.
// next-i18n-router 4 has its own currentLocale(), but it reads headers() synchronously,
// which is not possible since Next.js 16.
const LOCALE_HEADER = 'x-next-i18n-router-locale';

export const currentLocale = async (): Promise<string | undefined> => {
  const locale = (await headers()).get(LOCALE_HEADER);

  // The value selects a messages file, and on the sign in page (where next-auth does not run the router)
  // the header can come straight from a client: only known locales are accepted.
  return locale && i18nConfig.locales.includes(locale) ? locale : undefined;
};
