import MobileFooter from '../MobileFooter/MobileFooter';
import MobileHeader from '../MobileHeader/MobileHeader';
import cn from 'classnames';
import classes from './Sidebar.module.scss';

export async function Sidebar({
  title,
  children,
  type,
}: {
  title?: string;
  type:
    | 'usersList'
    | 'callsList'
    | 'violationsList'
    | 'settings'
    // like 'settings' (no footer, a back arrow), with the filters of the journals in the header
    | 'journal'
    | 'violationsManagement';
  children: React.ReactNode;
}) {
  const isOverlay = type === 'settings' || type === 'journal';

  return (
    <>
      <div
        className={cn(
          { 'full-height': !isOverlay },
          { [classes.settings]: isOverlay },
        )}
      >
        {type !== 'usersList' && <MobileHeader title={title} type={type} />}
        {!isOverlay && <MobileFooter />}
        <>{children}</>
      </div>
    </>
  );
}
