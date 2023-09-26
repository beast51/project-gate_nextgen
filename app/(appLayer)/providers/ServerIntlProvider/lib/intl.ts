import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';
import { createIntl } from '@formatjs/intl';
import { currentLocale } from 'next-i18n-router';

export default async function getIntl() {
  const locale = currentLocale() || i18nConfig.defaultLocale;

  return createIntl({
    locale: locale,
    messages: (await import(`@/locales/${locale}.json`)).default,
  });
}
