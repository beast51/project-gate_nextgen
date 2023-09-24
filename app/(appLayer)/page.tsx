import getIntl from './providers/ServerIntlProvider/lib/intl';
import styles from './page.module.css';
import cn from 'classnames';

export default async function Home() {
  const { $t } = await getIntl();
  return (
    <div className={cn(styles.main)}>
      Project GATE
      <>{$t({ id: 'theme' })}</>
    </div>
  );
}
