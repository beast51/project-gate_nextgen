import { VisitsType } from '@/entitiesLayer/Violation/model/types/ViolationList.types';
import { FC, memo } from 'react';
import classes from './StayTimerCardList.module.scss';
import { StayTimerCard } from '../../StayTimerCard';
import { StayTimerCardListProps } from '../StayTimerCardList.type';

const isOverstay = (visit: VisitsType['visits'][0], visitCount: number) => {
  // an open visit has no duration yet, it is shown the same way as an overstay
  if (!visit.violationTime) return true;

  return visit.violationTime >= 45 && visitCount > 0;
};

export const StayTimerCardList: FC<StayTimerCardListProps> = memo(
  ({ visits, visitCount }) => {
    return (
      <div className={classes.timesList}>
        {visits.map((visit: VisitsType['visits'][0]) => {
          return (
            <StayTimerCard
              visit={visit}
              isOverstay={isOverstay(visit, visitCount)}
              key={visit.timeIn}
            />
          );
        })}
      </div>
    );
  },
);
