'use client';

import { useCurrentLocale as useRouterLocale } from 'next-i18n-router/client';
import i18nConfig from '../config/i18n/i18nConfig';

// Locale of the current page, taken from the URL
export const useCurrentLocale = (): string | undefined => useRouterLocale(i18nConfig);
