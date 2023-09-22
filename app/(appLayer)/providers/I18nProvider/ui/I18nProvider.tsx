'use client';
import { FC, PropsWithChildren } from 'react';
import { I18nProviderClient } from '../../../../../locales/client';
import en from '../../../../../locales/en/en';
import React from 'react';

const I18nProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <I18nProviderClient fallback={<p> Loading...</p>} fallbackLocale={en}>
      {children}
    </I18nProviderClient>
  );
};

export default I18nProvider;
