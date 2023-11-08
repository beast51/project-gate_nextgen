// 'use client';

import { formatTime } from '@/sharedLayer/utils/date';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { ViolationsResponseType } from '../../model/types/ViolationList.types';
import { ViolationsCard } from '../ViolationsCard/ViolationsCard';
import classes from './ViolationsList.module.scss';

const START_OF_THE_DAY = formatTime(Date.now(), true);
const DATE_AND_TIME_NOW = formatTime(Date.now(), false);

const getViolations = async (url: string): Promise<ViolationsResponseType> => {
  const response = await fetch(url).then((res) => res.json());
  return response;
};

export const ViolationsList = () => {
  const searchParams = useSearchParams();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const to = paramsToString(searchParams.get('to')) || DATE_AND_TIME_NOW;

  const { data: violations, isLoading } = useSWR(
    `api/violations/?from=${from}&to=${to}`,
    getViolations,
  );

  if (isLoading) {
    return <p className="m-4">Список посетителей загружается...</p>;
  }

  return (
    <>
      {violations && JSON.stringify(violations) !== '{}' ? (
        <div className={classes.list}>
          {violations &&
            Object.entries(violations).map(([key, violation]) => {
              return (
                <ViolationsCard
                  key={violation.visits[0].timeIn}
                  phoneNumberOrApartment={key}
                  violation={violation}
                />
              );
            })}
        </div>
      ) : (
        <p className="m-4">На эту дату не было посетителей</p>
      )}
    </>
  );
};
