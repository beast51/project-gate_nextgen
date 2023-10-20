'use client';

import { formatTime } from '@/sharedLayer/utils/date';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { DatePicker } from '@/sharedLayer/ui/DatePicker';
import moment from 'moment';
import 'moment/locale/uk';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import classes from './MobileHeader.module.scss';

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
  title: string;
  type: 'usersList' | 'callsList' | 'violationsList';
}) => {
  const { $t } = useIntl();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const TIME_FROM_URL = useMemo(() => moment(from), [from]);
  const [selectedDate, setSelectedDate] = useState(TIME_FROM_URL || TIME_NOW);

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
      {type !== 'usersList' ? (
        <div className={classes.container}>
          {/* <p className="m-4 font-lg font-medium">{title}</p> */}
          <DatePicker
            label={$t({ id: 'Select date' })}
            onAccept={datePickerHandler}
            selectedDate={selectedDate}
          />
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default MobileHeader;
