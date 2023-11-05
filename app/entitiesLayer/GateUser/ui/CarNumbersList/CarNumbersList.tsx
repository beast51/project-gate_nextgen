import React from 'react';
import { FC, memo } from 'react';
import cn from 'classnames';
import classes from './CarNumbersList.module.scss';
import { CarNumber } from '@/sharedLayer/ui/CarNumber';

export type CarNumbersListProps = {
  carNumber: string[];
  className?: string;
};

export const CarNumbersList: FC<CarNumbersListProps> = memo(
  ({ carNumber, className }) => {
    return (
      <div className={cn(classes.carNumbers, className)}>
        {carNumber?.map((number) => {
          return <CarNumber carNumber={number} key={number} />;
        })}
      </div>
    );
  },
);
