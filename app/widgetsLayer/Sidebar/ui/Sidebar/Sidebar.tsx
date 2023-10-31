// import getCurrentUser from '@/app/actions/getCurrentUser';
// import DesktopSidebar from './DesktopSidebar';
// import MobileFooter from './MobileFooter';
// import MobileHeader from './MobileHeader';
// import clsx from 'clsx';
import getCurrentUser from '../../actions/getCurrentUser';
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
  type: 'usersList' | 'callsList' | 'violationsList' | 'settings';
  children: React.ReactNode;
}) {
  // const currentUser = await getCurrentUser();
  // console.log('type: ', type);
  // console.log('currentUser', currentUser);

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
        <div
        // className={clsx(
        //   type !== 'usersList' ? 'pt-32' : 'pt-15',
        //   'lg:pl-20 h-full',
        // )}
        >
          {children}
        </div>
      </div>
    </>
  );
}

// export default Sidebar;
