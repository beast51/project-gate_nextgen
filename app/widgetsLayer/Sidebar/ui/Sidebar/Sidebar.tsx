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
    | 'violationsManagement';
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className={cn(
          { 'full-height': type !== 'settings' },
          { [classes.settings]: type === 'settings' },
        )}
      >
        {type !== 'usersList' && <MobileHeader title={title} type={type} />}
        {type !== 'settings' && <MobileFooter />}
        {/* <DesktopSidebar currentUser={currentUser!} /> */}
        <>{children}</>
      </div>
    </>
  );
}

// export default Sidebar;
