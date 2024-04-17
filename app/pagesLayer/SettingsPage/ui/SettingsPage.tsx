'use client';

import styles from './SettingsPage.module.scss';
import { useIntl } from 'react-intl';
import { Button } from '@/sharedLayer/ui/Button';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { signOut } from 'next-auth/react';
import { ToggleTheme } from '@/sharedLayer/ui/Toggle';

export const SettingsPage = async () => {
  const { $t } = useIntl();
  return (
    <div className={styles.settings}>
      <div className={styles.wrapper}>
        <div className={styles.switchers}>
          <LangSwitcher />
          <ToggleTheme />
        </div>
        <div></div>
      </div>
      <Button
        className={styles.button}
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        {$t({ id: 'Exit' })}
      </Button>
    </div>
  );
};
