'use client';

import React from 'react';
import styles from './UserPage.module.scss';

import { useTheme } from '(appLayer)/providers/ThemeProvider';
import { useIntl } from 'react-intl';

import { Button } from '@/sharedLayer/ui/Button';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';

export const UserPage = async () => {
  const { toggleTheme } = useTheme();
  const { $t } = useIntl();
  return (
    <main className={styles.user}>
      USER Page
      <Button onClick={toggleTheme}>{$t({ id: 'theme' })}</Button>
      <LangSwitcher />
      {/* <Button onClick={toggleTheme}>{'theme'}</Button> */}
    </main>
  );
};
