'use client';

import React from 'react';
import styles from './UserPage.module.scss';
import { Button } from '@/sharedLayerui/Button';
import { useTheme } from '(appLayer)/providers/ThemeProvider';
import { useI18n, useScopedI18n } from '../../../../locales/client';

export const UserPage = () => {
  const { toggleTheme } = useTheme();
  const t = useI18n();
  return (
    <main className={styles.user}>
      USER Page
      <Button onClick={toggleTheme}>{t('theme')}</Button>
    </main>
  );
};
