import React from 'react';
import cn from 'classnames';
import Image from 'next/image';
import { AvatarProps } from '../Avatar.type';
import classes from './Avatar.module.scss';
import { FaTimes } from 'react-icons/fa';
import { MdOutlineQuestionMark } from 'react-icons/md';

export const Avatar: React.FC<AvatarProps> = ({
  image,
  name,
  isBlackListed,
  isSmall,
  className,
}) => {
  return (
    <div className={cn(classes.avatar, className)}>
      <div
        className={cn(classes.avatarContainer, {
          [classes.small]: isSmall,
          [classes.blackListed]: isBlackListed || name === 'Not registered',
        })}
      >
        <Image
          priority
          fill
          sizes="56px, (min-width: 768px) 72px"
          src={image || '/images/placeholder.jpg'}
          alt="Avatar"
          className={classes.image}
        />
      </div>
      {name === 'Not registered' ? (
        <div className={classes.statusIndicator}>
          <div className={classes.statusIcon}>
            <MdOutlineQuestionMark />
          </div>
        </div>
      ) : null}
      {isBlackListed ? (
        <div className={classes.statusIndicator}>
          <div className={classes.statusIcon}>
            <FaTimes />
          </div>
        </div>
      ) : null}
    </div>
  );
};
