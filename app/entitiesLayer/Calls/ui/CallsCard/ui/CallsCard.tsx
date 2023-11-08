import { CarNumbersList } from '@/entitiesLayer/GateUser';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import React, { FC } from 'react';
import cn from 'classnames';
import classes from './CallsCard.module.scss';
import moment from 'moment';
import { CallsCardPropsType } from '../../../model/types/Calls.type';

export const CallsCard: FC<CallsCardPropsType> = ({ call, onDoubleClick }) => {
  return (
    <li
      onDoubleClick={() => onDoubleClick(call.number)}
      className={cn(classes.gateUserCard, 'full-width')}
    >
      <div className={classes.wrapper}>
        <Avatar image={call.image} isSmall />
        <div className={classes.info}>
          <div className={classes.infoContainer}>
            <p className="text-sm font-medium text-gray-900 text-end">
              {call.apartmentNumber && `кв. ${call.apartmentNumber}`}
            </p>
            <p className={classes.phoneNumber}>
              {moment(call.time).format('HH:mm:ss')}
            </p>
          </div>
          <div className={classes.owner}>
            <p className={classes.phoneNumber}>
              {formatPhoneNumber(call.number)}
            </p>
            <p className={classes.name}>{call.callerName}</p>
          </div>
        </div>
      </div>
      <div className={classes.infoWrapper}>
        {call.carNumber && (
          <CarNumbersList
            carNumber={call.carNumber}
            className={classes.callsCarNumberList}
          />
        )}
      </div>
    </li>
  );
};
