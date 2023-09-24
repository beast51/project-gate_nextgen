import { createIntl } from '@formatjs/intl';
import { currentLocale } from 'next-i18n-router';

export default async function getIntl(namespace) {
  const locale = currentLocale();

  return createIntl({
    locale: locale,
    messages: (await import(`./../locales/${locale}.json`)).default,
  });
}
