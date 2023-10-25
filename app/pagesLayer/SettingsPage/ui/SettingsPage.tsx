'use client';

import React from 'react';
import styles from './SettingsPage.module.scss';

import { useTheme } from '(appLayer)/providers/ThemeProvider';
import { useIntl } from 'react-intl';

import { Button } from '@/sharedLayer/ui/Button';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { signOut } from 'next-auth/react';

export const SettingsPage = async () => {
  const { toggleTheme } = useTheme();
  const { $t } = useIntl();
  return (
    <div className={styles.settings}>
      USER Page
      <Button onClick={() => signOut({ callbackUrl: '/' })}>Exit</Button>
      <Button onClick={toggleTheme}>{$t({ id: 'theme' })}</Button>
      <LangSwitcher />
      {/* <Button onClick={toggleTheme}>{'theme'}</Button> */}
    </div>
  );
};
