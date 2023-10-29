import { FC, memo } from 'react';
import classes from './CarNumbersList.module.scss';
import { CarNumber } from '@/sharedLayer/ui/CarNumber';

export type CarNumbersListProps = {
  carNumber: string[];
};

export const CarNumbersList: FC<CarNumbersListProps> = memo(({ carNumber }) => {
  return (
    <div className={classes.carNumbers}>
      {carNumber?.map((number) => {
        return <CarNumber carNumber={number} key={number} />;
      })}
    </div>
  );
});
