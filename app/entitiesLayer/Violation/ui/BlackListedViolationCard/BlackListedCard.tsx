'use client';

import clsx from 'clsx';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { VisitsType } from '../../model/types/ViolationList.types';
import Link from 'next/link';
import classes from './BlackListedCard.module.scss';
import { useMemo } from 'react';
import cn from 'classnames';
import { usePathname } from 'next/navigation';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { CarNumbersList } from '@/entitiesLayer/GateUser';
import { StayTimerCardList } from '../StayTimerCardList';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import { formatTime } from '@/sharedLayer/utils/date';
import moment from 'moment';
import { useIntl } from 'react-intl';

type BlackListedCardType = {
  user: GateUserType;
};

const isTimeToRemoveFromBlackList = (time: string) => {
  const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
  const date1 = moment(time, 'YYYY-MM-DD HH:mm:ss');
  const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss');
  const diffMinutes = date2.diff(date1, 'minutes');
  return diffMinutes > 1;
};

const getTimeToUnblock = (time: string) => {
  if (!time) return null;

  const DATE_AND_TIME_NOW = formatTime(Date.now(), false).toString();
  const date1 = moment(time, 'YYYY-MM-DD HH:mm:ss');
  const date2 = moment(DATE_AND_TIME_NOW, 'YYYY-MM-DD HH:mm:ss');
  const diffMinutes = date2.diff(date1, 'minutes');
  const diffHours = date2.diff(date1, 'hours');
  const diffDays = date2.diff(date1, 'days');

  if (diffMinutes > 1) return null;
  if (-diffMinutes > 1440) return `${-diffDays} д.`;
  if (-diffMinutes < 1440 && -diffMinutes > 60) return `${-diffHours} ч.`;
  return `${-diffMinutes} хв.`;
};

export const BlackListedCard: React.FC<BlackListedCardType> = (user) => {
  const {
    carNumber,
    image,
    apartmentNumber,
    phoneNumber,
    name,
    blackListedFrom,
    blackListedTo,
  } = user.user;

  const { $t } = useIntl();
  const isTimeToUnblock = isTimeToRemoveFromBlackList(blackListedTo!);
  const timeToUnblock = getTimeToUnblock(blackListedTo!);

  return (
    <Link
      href={`/users/${phoneNumber}`}
      className={cn(classes.card, {
        [classes.withViolation]: !isTimeToUnblock,
      })}
    >
      <div className={classes.container}>
        <Avatar image={image} isSquare />
        <div className={classes.info}>
          <div className={classes.infoContainer}>
            <div className={classes.phoneNumber}>{phoneNumber}</div>
            {apartmentNumber && `${$t({ id: 'apt' })}${apartmentNumber}`}
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
      <div className={classes.time}>
        <div className={classes.fromTo}>
          <p>
            {isTimeToUnblock
              ? $t({ id: 'needToUnblock' })
              : $t({ id: 'Blocked' })}
          </p>
          {blackListedTo ? (
            <>
              <p>{`${$t({ id: 'from' })} ${blackListedFrom}`}</p>
              <p>{`${$t({ id: 'to' })} ${blackListedTo}`}</p>
            </>
          ) : (
            'назавжди'
          )}
        </div>

        {timeToUnblock && (
          <p className={classes.timeToUnblock}>{timeToUnblock}</p>
        )}
      </div>
    </Link>
  );
};
