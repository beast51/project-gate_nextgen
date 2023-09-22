import styles from '../page.module.css';
import cn from 'classnames';
import { useTheme } from '../providers/ThemeProvider';
import { Button } from '@/sharedLayerui/Button';
import { useI18n, useScopedI18n } from '../../../locales/client';
import { getI18n, getScopedI18n } from '../../../locales/server';
import { UserPage } from 'pagesLayer/UserPage';

export default async function Home() {
  const t = await getI18n();
  return (
    <div className={cn(styles.main)}>
      Project GATE
      <>{t('theme')}</>
    </div>
  );
}
