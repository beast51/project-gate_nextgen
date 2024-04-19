'use client';

import { Avatar } from '@/sharedLayer/ui/Avatar';
import Link from 'next/link';
import classes from './BlackListedCard.module.scss';
import cn from 'classnames';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import { CarNumbersList } from '@/entitiesLayer/GateUser';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import { changeFormatTime, formatTime } from '@/sharedLayer/utils/date';
import { useIntl } from 'react-intl';
import {
  getTimeToUnblock,
  isTimeToRemoveFromBlackList,
} from '@/sharedLayer/utils/utils';

type BlackListedCardType = {
  user: GateUserType;
};

const unlockHandler = (event: { preventDefault: () => void }) => {
  event.preventDefault();
  console.log('work');
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
            <div className={classes.phoneNumber}>
              {formatPhoneNumber(phoneNumber)}
            </div>
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
              <div className={classes.fromToWrapper}>
                <p>{changeFormatTime(blackListedFrom!)}</p>
                <p>{changeFormatTime(blackListedTo)}</p>
              </div>
            </>
          ) : (
            'назавжди'
          )}
        </div>

        {timeToUnblock && (
          <p className={classes.timeToUnblock}>{timeToUnblock}</p>
        )}
        {/* {!timeToUnblock ? (
          <p className={classes.timeToUnblock}>{timeToUnblock}</p>
        ) : (
          <Button onClick={unlockHandler} className={classes.button}>
            Unlock
          </Button>
        )} */}
      </div>
    </Link>
  );
};
