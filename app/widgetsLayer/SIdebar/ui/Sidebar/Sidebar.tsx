// import getCurrentUser from '@/app/actions/getCurrentUser';
// import DesktopSidebar from './DesktopSidebar';
// import MobileFooter from './MobileFooter';
// import MobileHeader from './MobileHeader';
// import clsx from 'clsx';
import getCurrentUser from '../../actions/getCurrentUser';
import MobileFooter from '../MobileFooter/MobileFooter';

export async function Sidebar({
  title,
  children,
  type,
}: {
  title: string;
  type: 'usersList' | 'callsList' | 'violationsList';
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  console.log('type: ', type);
  console.log('currentUser', currentUser);
  return (
    <div className="full-height">
      {/* <MobileHeader title={title} type={type} /> */}
      <MobileFooter />
      {/* <DesktopSidebar currentUser={currentUser!} /> */}

      <main
      // className={clsx(
      //   type !== 'usersList' ? 'pt-32' : 'pt-15',
      //   'lg:pl-20 h-full',
      // )}
      >
        {children}
      </main>
    </div>
  );
}

// export default Sidebar;
