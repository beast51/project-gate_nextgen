import { CarNumbersList } from '@/entitiesLayer/GateUser';
import { Avatar } from '@/sharedLayer/ui/Avatar';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import React, { FC } from 'react';
import cn from 'classnames';
import classes from './CallsCard.module.scss';
import moment from 'moment';
import { CallsCardPropsType } from '../../../model/types/Calls.type';
import { useIntl } from 'react-intl';
import { rename } from '@/sharedLayer/utils/rename';

const causeList = {
  '16': 'Довге очикування, але відкрив',
  '17': 'Відкрив',
  '18': 'Довге очикування, але відкрив',
  '19': 'Тимчасово недоступний напрямок алу відкрив',
};

const causeErrorsList = {
  '31': "Невдале з'єднання",
  '38': 'Помилка зі сторони оператора',
};

export const causeErrorsMap = new Map(
  Object.entries(causeErrorsList).map(([key, value]) => [Number(key), value]),
);
export const causeMap = new Map(
  Object.entries(causeList).map(([key, value]) => [Number(key), value]),
);

console.log(causeErrorsMap);

export const CallsCard: FC<CallsCardPropsType> = ({ call, onDoubleClick }) => {
  // console.log(call);
  const isCauseError = causeErrorsMap.has(call.cause);

  const { $t } = useIntl();
  return (
    <li
      onDoubleClick={() => onDoubleClick(call.number)}
      className={cn(classes.gateUserCard, 'full-width')}
    >
      <div className={classes.wrapper}>
        <Avatar
          image={call.image}
          isSmall
          name={call.callerName}
          isBlackListed={call.isBlackListed}
          isCauseError={isCauseError}
        />
        <div className={classes.info}>
          <div className={classes.infoContainer}>
            <p className="text-sm font-medium text-gray-900 text-end">
              {call.apartmentNumber && `кв. ${call.apartmentNumber}`}
            </p>
            <div className={classes.timeWrapper}>
              <p className={classes.phoneNumber}>
                {moment(call.time).format('HH:mm:ss')}
              </p>
              <div
                className={classes.state}
              >{`${call.cause}: ${call.state}: calltime: ${call.secondsFullTime}`}</div>
            </div>
          </div>
          <div className={classes.owner}>
            <p className={classes.phoneNumber}>
              {formatPhoneNumber(call.number)}
            </p>
            <p className={classes.name}>{rename(call.callerName)}</p>
          </div>
        </div>
      </div>
      {call.isBlackListed && (
        <div className={classes.blackListed}>
          <p>{$t({ id: 'Blocked' })}</p>
          {call.blackListedFrom && call.blackListedTo && (
            <p>
              {$t({ id: 'from' })}{' '}
              {moment(call.blackListedFrom).format('DD-MM-YYYY HH:mm')}{' '}
              {$t({ id: 'to' })}{' '}
              {moment(call.blackListedTo).format('DD-MM-YYYY HH:mm')}
            </p>
          )}
        </div>
      )}
      {!call.isBlackListed && causeErrorsMap.has(call.cause) && (
        <div className={classes.cause}>
          {`${call.cause}: ${causeErrorsMap.get(call.cause)}`}
        </div>
      )}
      {call.carNumber.length > 0 && call.carNumber[0].length > 0 && (
        <div className={classes.infoWrapper}>
          <CarNumbersList
            carNumber={call.carNumber}
            className={classes.callsCarNumberList}
          />
        </div>
      )}
    </li>
  );
};
