'use client';

// import useConversation from '@/hooks/useConversation';
import useRoutes from '../../hooks/useRoutes';
import MobileItem from '../MobileItem/MobileItem';
import cls from './MobileFooter.module.scss';

const MobileFooter = () => {
  const routes = useRoutes();
  // const { isOpen } = useConversation();

  // if (isOpen) {
  //   return null;
  // }

  return (
    <div className={cls.mobileFooter}>
      {routes.map((route) => (
        <MobileItem
          key={route.href}
          label={route.label}
          href={route.href}
          active={route.active}
          icon={route.icon}
          onClick={route.onClick}
        />
      ))}
    </div>
  );
};

export default MobileFooter;
