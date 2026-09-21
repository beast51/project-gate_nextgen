'use client';

import { FC, memo } from 'react';
import cn from 'classnames';
import classes from './StayTimerCard.module.scss';
import { StayTimerCardProps } from '../StayTimerCard.type';
import { useIntl } from 'react-intl';

export const StayTimerCard: FC<StayTimerCardProps> = memo(
  ({ visit, isOverstay, openLabel = '?' }) => {
    const { $t } = useIntl();
    return (
      <div
        className={cn(classes.time, {
          [classes.overstay]: isOverstay,
        })}
        key={visit.violationTime}
      >
        <p className={cn({ [classes.openLabel]: !visit.violationTime && openLabel !== '?' })}>
          {visit.violationTime
            ? `${visit.violationTime} ${$t({ id: 'min.' })}`
            : openLabel}
        </p>
        <div className={classes.wrapper}>
          <p>{visit.timeIn.split(' ')[1]}</p>
          <p>{visit.timeOut?.split(' ')[1]}</p>
        </div>
      </div>
    );
  },
);
