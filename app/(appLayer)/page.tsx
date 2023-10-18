import getIntl from './providers/ServerIntlProvider/lib/intl';
import styles from './page.module.css';
import cn from 'classnames';
import { AuthForm } from '../featuresLayer/AuthForm';

export default async function Home() {
  const { $t } = await getIntl();
  return (
    <div className={cn(styles.main, 'app')}>
      <p className="mb32">Project GATE</p>
      {/* <>{$t({ id: 'theme' })}</> */}
      <AuthForm />
    </div>
  );
}
