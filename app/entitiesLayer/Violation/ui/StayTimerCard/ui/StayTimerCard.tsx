import { FC, memo } from 'react';
import cn from 'classnames';
import classes from './StayTimerCard.module.scss';
import { StayTimerCardProps } from '../StayTimerCard.type';
import { useIntl } from 'react-intl';

export const StayTimerCard: FC<StayTimerCardProps> = memo(
  ({ visit, isOverstay }) => {
    const { $t } = useIntl();
    return (
      <div
        className={cn(classes.time, {
          [classes.overstay]: isOverstay,
        })}
        key={visit.violationTime}
      >
        <p>
          {visit.violationTime
            ? `${visit.violationTime} ${$t({ id: 'min.' })}`
            : '?'}
        </p>
        <div className={classes.wrapper}>
          <p>{visit.timeIn.split(' ')[1]}</p>
          <p>{visit.timeOut?.split(' ')[1]}</p>
        </div>
      </div>
    );
  },
);
