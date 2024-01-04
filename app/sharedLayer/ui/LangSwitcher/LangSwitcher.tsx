'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useCurrentLocale } from 'next-i18n-router/client';
import i18nConfig from '../../config/i18n/i18nConfig';
import { Select } from '../Select';
import { MenuItem, SelectChangeEvent } from '@mui/material';
import { useIntl } from 'react-intl';

export default function LanguageChanger() {
  const router = useRouter();
  const currentPathname = usePathname();
  const currentLocale = useCurrentLocale(i18nConfig);
  const { $t } = useIntl();

  const handleChange = (e: SelectChangeEvent<string>) => {
    const newLocale = e.target.value;

    // set cookie for next-i18n-router
    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = '; expires=' + date.toUTCString();
    document.cookie = `NEXT_LOCALE=${newLocale};expires=${expires};path=/`;

    if (
      currentLocale === i18nConfig.defaultLocale
      // &&
      // !i18nConfig.prefixDefault
    ) {
      router.push('/' + newLocale + currentPathname);
    } else {
      router.push(
        currentPathname.replace(`/${currentLocale}`, `/${newLocale}`),
      );
    }

    router.refresh();
  };

  return (
    <Select
      label={$t({ id: 'Language' })}
      value={currentLocale!}
      onChange={handleChange}
    >
      <MenuItem value="uk">Українська</MenuItem>
      <MenuItem value="en">English</MenuItem>
    </Select>
  );
}
