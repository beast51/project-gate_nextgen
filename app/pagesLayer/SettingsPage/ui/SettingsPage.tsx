'use client';

import cn from 'classnames';
import styles from './SettingsPage.module.scss';
import { useIntl } from 'react-intl';
import { Button } from '@/sharedLayer/ui/Button';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { signOut } from '@/sharedLayer/framework/session';
import { ToggleTheme } from '@/sharedLayer/ui/Toggle';

type SettingsPageProps = {
  // extra content of a section, shown between the switchers and the exit button
  children?: React.ReactNode;
};

export const SettingsPage = ({ children }: SettingsPageProps) => {
  const { $t } = useIntl();
  return (
    <div className={cn(styles.settings, { [styles.withContent]: Boolean(children) })}>
      <div className={styles.wrapper}>
        <div className={styles.switchers}>
          <LangSwitcher />
          <ToggleTheme />
        </div>
        <div></div>
      </div>
      {children}
      <Button
        className={styles.button}
        onClick={() => signOut('/')}
      >
        {$t({ id: 'Exit' })}
      </Button>
    </div>
  );
};
