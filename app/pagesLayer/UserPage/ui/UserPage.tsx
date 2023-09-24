'use client';

import React from 'react';
import styles from './UserPage.module.scss';
import { Button } from '@/sharedLayerui/Button';
import { useTheme } from '(appLayer)/providers/ThemeProvider';
import { useIntl } from 'react-intl';
import LangSwitcher from '@/sharedLayerui/LangSwitcher/LangSwitcher';
// import { useIntl } from 'react-intl';

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
