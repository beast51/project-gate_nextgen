'use client';
import { formatTime } from '@/sharedLayer/utils/date';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { useSearchParams } from 'next/navigation';
import React, { FC, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { CallsCard } from '../CallsCard';
import classes from './CallsList.module.scss';
import { CallType } from '../../model/types/Calls.type';
import { useIntl } from 'react-intl';

export type CallsListPropsType = {};

const START_OF_THE_DAY = formatTime(Date.now(), true);
const DATE_AND_TIME_NOW = formatTime(Date.now(), false);

const getCalls = async (url: string) => {
  const response = await fetch(url).then((res) => res.json());
  return response;
};

export const CallsList: FC<CallsListPropsType> = () => {
  const { $t } = useIntl();
  const searchParams = useSearchParams();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const to = paramsToString(searchParams.get('to')) || DATE_AND_TIME_NOW;

  const { data: calls, isLoading } = useSWR<CallType[]>(
    `api/calls/?from=${from}&to=${to}`,
    getCalls,
  );

  const [filteredCalls, setFilteredCalls] = useState(calls);
  const [isFilteredCalls, setIsFilteredCalls] = useState(false);

  useEffect(() => {
    setFilteredCalls(calls);
  }, [calls]);

  const showCallsFromPhonenumber = useCallback(
    (phoneNumber: string) => {
      !isFilteredCalls
        ? setFilteredCalls(
            filteredCalls?.filter((call) => call.number === phoneNumber),
          )
        : setFilteredCalls(calls);
      setIsFilteredCalls(!isFilteredCalls);
    },
    [calls, isFilteredCalls, filteredCalls],
  );

  if (isLoading) {
    return <p className="m-4">{$t({ id: 'calls are loading' })}</p>;
  }

  return (
    <ul className={classes.callsList}>
      {filteredCalls !== undefined &&
        filteredCalls.map((call) => {
          return (
            <CallsCard
              call={call}
              onDoubleClick={showCallsFromPhonenumber}
              key={call.time}
            />
          );
        })}
    </ul>
  );
};
