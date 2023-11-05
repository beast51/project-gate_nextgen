'use client';
import React, { memo, useMemo } from 'react';
import cn from 'classnames';
import classes from './GateUserCard.module.scss';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { GateUserCardProps } from '../../model/types/GateUser.type';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { CarNumbersList } from '../CarNumbersList/CarNumbersList';

export const GateUserCard: React.FC<GateUserCardProps> = memo(({ data }) => {
  const pathname = usePathname();

  const linkClassName = useMemo(() => {
    return cn(
      classes.gateUserCard,
      { [classes.gateUserCardBig]: data.carNumber.length > 4 },
      'full-width',
    );
  }, [data.carNumber]);

  return (
    <Link href={`${pathname}/${data.phoneNumber}`} className={linkClassName}>
      <Avatar image={data.image} />
      <div className={classes.info}>
        <div className={classes.infoContainer}>
          <p className={classes.phoneNumber}>
            {formatPhoneNumber(data.phoneNumber)}
          </p>
          <p className="text-sm font-medium text-gray-900 text-end">
            {data.apartmentNumber && `кв. ${data.apartmentNumber}`}
          </p>
        </div>
        <p className={classes.name}>{data.name}</p>
        <div className={classes.infoWrapper}>
          <CarNumbersList carNumber={data.carNumber} />
        </div>
      </div>
    </Link>
  );
});
