'use client';
import { formatTime } from '@/sharedLayer/utils/date';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { useSearchParams } from '@/sharedLayer/framework/navigation';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useCalls } from '@/sharedLayer/api';
import { CallsCard } from '../CallsCard';
import classes from './CallsList.module.scss';
import { CallType } from '../../model/types/Calls.type';
import { useIntl } from 'react-intl';
import { matchesSearch, useListSearch } from '@/sharedLayer/lib/search';

export type CallsListPropsType = {};

const START_OF_THE_DAY = formatTime(Date.now(), true);
const DATE_AND_TIME_NOW = formatTime(Date.now(), false);

export const CallsList: FC<CallsListPropsType> = () => {
  const { $t } = useIntl();
  const searchParams = useSearchParams();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const to = paramsToString(searchParams.get('to')) || DATE_AND_TIME_NOW;

  const { data: calls, isLoading } = useCalls({ from, to });

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

  const { query, mode } = useListSearch();
  const foundCalls = useMemo(
    () => filteredCalls?.filter((call) => matchesSearch({
      phones: [call.number],
      apartment: call.apartmentNumber,
      cars: call.carNumber,
      name: call.callerName,
    }, query, mode)),
    [filteredCalls, query, mode],
  );

  if (isLoading) {
    return <p className="m-4">{$t({ id: 'calls are loading' })}</p>;
  }

  return (
    <ul className={classes.callsList}>
      {query && foundCalls?.length === 0 && <li className="m-4">{$t({ id: 'search: nothing found' })}</li>}
      {foundCalls !== undefined &&
        foundCalls.map((call) => {
          return (
            <CallsCard
              call={call}
              onDoubleClick={showCallsFromPhonenumber}
              key={`${call.number}|${call.time}`}
            />
          );
        })}
    </ul>
  );
};
