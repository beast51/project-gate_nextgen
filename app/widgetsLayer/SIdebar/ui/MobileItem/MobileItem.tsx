import Link from 'next/link';
import React from 'react';
import cn from 'classnames';
import cls from './MobileItem.module.scss';

// import clsx from 'clsx';

interface MobileItemProps {
  label: string;
  href: string;
  icon: any;
  active?: boolean;
  onClick?: () => void;
}

const MobileItem: React.FC<MobileItemProps> = ({
  label,
  href,
  icon: Icon,
  active,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      return onClick();
    }
  };

  return (
    <Link
      onClick={handleClick}
      href={href}
      className={cn(cls.mobileItem, { [cls.active]: active })}
      // className={clsx(
      //   `
      //   group
      //   flex
      //   gap-x-3
      //   text-sm
      //   leading-6
      //   font-semibold
      //   w-full
      //   justify-center
      //   p-4
      //   text-gray-500
      //   hover:text-black
      //   hover:bg-gray-100
      // `,
      //   active && 'bg-gray-100 text-black',
      // )}
    >
      <Icon className={cls.icon} />
      <span className="sr-only">{label}</span>
    </Link>
  );
};

export default MobileItem;
