'use client';

import { formatTime } from '@/sharedLayer/utils/date';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { DatePicker } from '@/sharedLayer/ui/DatePicker';
import moment from 'moment';
import 'moment/locale/uk';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import classes from './MobileHeader.module.scss';
import { Button } from '@/sharedLayer/ui/Button';
import { FaEllipsisV } from 'react-icons/fa';
import { FaArrowLeftLong } from 'react-icons/fa6';
import Link from 'next/link';
import { AppLink } from '@/sharedLayer/ui/AppLink';

export const getFromToFromDataPicker = (date: string | null) => {
  const from = moment(date, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (zz)').format(
    'YYYY-MM-DD 00:00:00',
  );
  const to = moment(date, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (zz)').format(
    'YYYY-MM-DD 23:59:59',
  );
  return { from, to };
};

const TIME_NOW = moment();
const START_OF_THE_DAY = formatTime(Date.now(), true);

const MobileHeader = ({
  title,
  type,
}: {
  title?: string;
  type: 'usersList' | 'callsList' | 'violationsList' | 'settings';
}) => {
  const { $t } = useIntl();
  const router = useRouter();
  console.log();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const TIME_FROM_URL = useMemo(() => moment(from), [from]);
  const [selectedDate, setSelectedDate] = useState(TIME_FROM_URL || TIME_NOW);

  console.log('pathname', pathname);
  console.log('searchParams', searchParams);

  const datePickerHandler = (value: string | null) => {
    const { from, to } = getFromToFromDataPicker(value);
    router.push(
      type === 'callsList'
        ? `/calls?from=${from}&to=${to}`
        : `/violations?from=${from}&to=${to}`,
    );
  };

  return (
    <div className={classes.header}>
      <div className={classes.container}>
        {/* <p className="m-4 font-lg font-medium">{title}</p> */}
        {(type === 'callsList' || type === 'violationsList') && (
          <DatePicker
            label={$t({ id: 'Select date' })}
            onAccept={datePickerHandler}
            selectedDate={selectedDate}
          />
        )}
      </div>
      {type !== 'settings' ? (
        <AppLink href={`${pathname}/settings`}>
          <FaEllipsisV />
        </AppLink>
      ) : (
        <AppLink href={`${pathname.replace(/\/settings$/, '')}`}>
          <FaArrowLeftLong />
        </AppLink>
      )}
    </div>
  );
};

export default MobileHeader;
