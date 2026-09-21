import { headers } from 'next/headers';
import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';

// proxy.ts puts the locale of the request into this request header.
// next-i18n-router 4 has its own currentLocale(), but it reads headers() synchronously,
// which is not possible since Next.js 16.
const LOCALE_HEADER = 'x-next-i18n-router-locale';

export const currentLocale = async (): Promise<string | undefined> => {
  const locale = (await headers()).get(LOCALE_HEADER);

  // the value selects a messages file, so only known locales are accepted
  return locale && i18nConfig.locales.includes(locale) ? locale : undefined;
};
