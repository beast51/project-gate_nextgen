import cls from './AppLink.module.scss';
import cn from 'classnames';
import { type FC } from 'react';
import Link, { LinkProps } from 'next/link';
import React from 'react';
import { AppLinkProps } from '../AppLink.type';

export const AppLink: FC<AppLinkProps> = (props) => {
  const {
    href,
    className,
    children,
    variant = 'primary',
    ...otherProps
  } = props;

  return (
    <Link
      href={href}
      className={cn(cls.appLink, variant, className)}
      {...otherProps}
    >
      {children}
    </Link>
  );
};
