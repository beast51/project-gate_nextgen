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
  // A settings page covers the whole section, its navigation included. The journals page is nested the same
  // way but keeps the navigation of the section visible, so it is not an overlay; the footer it shows
  // is the one of the section layout around it.
  const isOverlay = type === 'settings';
  const hasOwnFooter = type !== 'settings' && type !== 'journal';

  return (
    <>
      <div
        className={cn(
          { 'full-height': hasOwnFooter },
          { [classes.settings]: isOverlay },
        )}
      >
        {type !== 'usersList' && <MobileHeader title={title} type={type} />}
        {hasOwnFooter && <MobileFooter />}
        <>{children}</>
      </div>
    </>
  );
}
