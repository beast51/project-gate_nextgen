import cls from './AppLink.module.scss';
import cn from 'classnames';
import { type FC } from 'react';
import Link, { LinkProps } from 'next/link';
import React from 'react';

export enum AppLinkVariant {
  PRIMARY = 'primary',
  // SECONDARY = 'secondary',
  // RED = 'red',
}

interface AppLinkProps extends LinkProps {
  className?: string;
  variant?: AppLinkVariant;
  children?: React.ReactNode;
}

export const AppLink: FC<AppLinkProps> = (props) => {
  const {
    href,
    className,
    children,
    variant = AppLinkVariant.PRIMARY,
    ...otherProps
  } = props;

  return (
    <Link
      href={href}
      className={cn(cls.AppLink, variant, className)}
      {...otherProps}
    >
      {children}
    </Link>
  );
};
