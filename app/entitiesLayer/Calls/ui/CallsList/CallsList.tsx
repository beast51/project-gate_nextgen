'use client';
import { formatTime } from '@/sharedLayer/utils/date';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { FC } from 'react';
import useSWR from 'swr';
import { CallsCard } from '../CallsCard';
import classes from './CallsList.module.scss';

export type CallsListPropsType = {};

export type CallType = {
  number: string;
  time: string;
  callerName: string;
  image?: string;
  carNumber?: string[];
  apartmentNumber?: string;
  isBlackListed: boolean;
  blackListedFrom: string;
  blackListedTo: string;
};

const START_OF_THE_DAY = formatTime(Date.now(), true);
const DATE_AND_TIME_NOW = formatTime(Date.now(), false);

const getCalls = async (url: string) => {
  const response = await fetch(url).then((res) => res.json());
  return response;
};

export const CallsList: FC<CallsListPropsType> = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const to = paramsToString(searchParams.get('to')) || DATE_AND_TIME_NOW;

  console.log(pathname);

  const { data: calls, isLoading } = useSWR<CallType[]>(
    `api${pathname}/?from=${from}&to=${to}`,
    getCalls,
  );

  console.log(calls);

  return (
    <ul className={classes.callsList}>
      {calls !== undefined &&
        calls.map((call) => {
          return <CallsCard call={call} key={call.time} />;
        })}
    </ul>
  );
};
