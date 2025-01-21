'use client';

import useRoutes from '../../hooks/useRoutes';
import MobileItem from '../MobileItem/MobileItem';
import cls from './MobileFooter.module.scss';

const MobileFooter = () => {
  const routes = useRoutes();
  return (
    <div className={cls.mobileFooter}>
      {routes.map((route) => (
        <MobileItem
          key={route.href}
          label={route.label}
          href={route.href}
          active={route.active}
          icon={route.icon}
        />
      ))}
    </div>
  );
};

export default MobileFooter;
