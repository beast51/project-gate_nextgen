'use client';

import clsx from 'clsx';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { VisitsType } from '../../model/types/ViolationList.types';
import Link from 'next/link';
import classes from './ViolationCard.module.scss';
import { useMemo } from 'react';
import cn from 'classnames';
import { usePathname } from 'next/navigation';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { CarNumbersList } from '@/entitiesLayer/GateUser';
import { StayTimerCardList } from '../StayTimerCardList';

export type ViolationsCardPropsType = {
  phoneNumberOrApartment: string;
  violation: VisitsType;
};

export const ViolationsCard: React.FC<ViolationsCardPropsType> = ({
  phoneNumberOrApartment,
  violation: {
    aboutUser: { carNumber, image, apartmentNumber, number, name },
    violationCount,
    visitCount,
    visits,
  },
}) => {
  return (
    <Link
      href={`/users/${number && number[0]}`}
      className={cn(classes.card, { [classes.withViolation]: violationCount })}
    >
      <div className={classes.container}>
        <Avatar image={image} isSquare />
        <div className={classes.info}>
          <div className={classes.infoContainer}>
            <div className={classes.phoneNumber}>
              {apartmentNumber === null
                ? formatPhoneNumber(phoneNumberOrApartment)
                : number?.map((num) => {
                    return <p>{formatPhoneNumber(num)}</p>;
                  })}
              {apartmentNumber === null && name && (
                <p className={classes.name}>{name}</p>
              )}
            </div>
            <div className="pr-3">
              {apartmentNumber === null ? (
                <p>{null}</p>
              ) : (
                <p>{`кв. ${phoneNumberOrApartment}`}</p>
              )}
            </div>
          </div>
          {carNumber.length > 0 && carNumber[0].length > 0 && (
            <div className={classes.infoWrapper}>
              <CarNumbersList
                carNumber={carNumber}
                className={classes.carNumberList}
              />
            </div>
          )}
        </div>
      </div>

      <StayTimerCardList visits={visits} visitCount={visitCount} />
    </Link>
  );
};
