import Link from 'next/link';
import React from 'react';
import cn from 'classnames';
import cls from './MobileItem.module.scss';
interface MobileItemProps {
  label: string;
  href: string;
  icon: any;
  active?: boolean;
}

const MobileItem: React.FC<MobileItemProps> = ({
  label,
  href,
  icon: Icon,
  active,
}) => {
  return (
    <Link href={href} className={cn(cls.mobileItem, { [cls.active]: active })}>
      <Icon className={cls.icon} />
      <span className="sr-only">{label}</span>
    </Link>
  );
};

export default MobileItem;
