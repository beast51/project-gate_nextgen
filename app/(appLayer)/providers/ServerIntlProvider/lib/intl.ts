import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';
import { createIntl } from '@formatjs/intl';
import { currentLocale } from './currentLocale';

export default async function getIntl() {
  const locale = (await currentLocale()) || i18nConfig.defaultLocale;

  return createIntl({
    locale: locale,
    messages: (await import(`@/locales/${locale}.json`)).default,
  });
}
