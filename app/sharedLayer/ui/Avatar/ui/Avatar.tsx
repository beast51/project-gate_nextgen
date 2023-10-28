'use client';
import React from 'react';
import cn from 'classnames';
// import { GateUserType } from '@/services/gateUsers';
// import { GateUser } from '@prisma/client';

// import useActiveList from '../hooks/useActiveList';
import Image from 'next/image';
import { AvatarProps } from '../Avatar.type';
import classes from './Avatar.module.scss';

export const Avatar: React.FC<AvatarProps> = ({
  image,
  name,
  isBlackListed,
  className,
}) => {
  // const { members } = useActiveList();
  // const isActive = members.indexOf(user?.email!) !== -1;
  const isActive = false;

  return (
    // <div
    //   className="
    //   flex
    //   flex-col
    //   items-center
    // "
    // >
    <div
      className={cn(classes.avatar, className)}
      //   className="
      // relative
      // flex
      // flex-center
      // "
    >
      <div
        className={classes.avatarContainer}
        //   className="
        //   relative
        //   inline-block
        //   rounded-full
        //   overflow-hidden
        //   h-14
        //   w-14
        //   md:h-18
        //   md:w-18
        // "
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
      {/* {!isActive ? (
          <span
            className="
            absolute 
            block 
            rounded-full 
            bg-green-500 
            ring-2 
            ring-white 
            top-0 
            right-0
            h-2 
            w-2 
            md:h-3 
            md:w-3
          "
          />
        ) : null} */}
      {/* {!isActive ? (
          <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-white">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  w-2 h-2 rounded-full">
              <span
                className="absolute bg-red-500 w-2 h-0.5 transform rotate-45 origin-center"
                style={{ top: '50%' }}
              ></span>
              <span
                className="absolute bg-red-500 w-2 h-0.5 transform -rotate-45 origin-center"
                style={{ top: '50%' }}
              ></span>
            </div>
          </div>
        ) : null} */}
      {name === 'Not registered' ? (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-white">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  w-2 h-2 rounded-full flex items-center justify-center">
            <span className="absolute text-red-500 text-xxs font-bold">?</span>
          </div>
        </div>
      ) : null}
      {isBlackListed ? (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-white">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  w-2 h-2 rounded-full flex items-center justify-center">
            <span className="absolute text-red-500 text-xxs font-bold">x</span>
          </div>
        </div>
      ) : null}
    </div>
    // </div>
  );
};
