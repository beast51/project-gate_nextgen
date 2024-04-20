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
import { FaEllipsisV, FaUnlock } from 'react-icons/fa';

import { FaArrowLeftLong } from 'react-icons/fa6';
import { AppLink } from '@/sharedLayer/ui/AppLink';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { ToggleTheme } from '@/sharedLayer/ui/Toggle';
import { Button } from '@/sharedLayer/ui/Button';
import { MdOutlineManageAccounts } from 'react-icons/md';

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

const unblockAllGreens = async () => {
  try {
    const response = await fetch(
      '/api/violations/unblock_expired_penalties_users',
      { method: 'POST' },
    );
    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error('Failed to unlock users:', error);
  }
};

const MobileHeader = ({
  title,
  type,
}: {
  title?: string;
  type:
    | 'usersList'
    | 'callsList'
    | 'violationsList'
    | 'settings'
    | 'violationsManagement';
}) => {
  const { $t } = useIntl();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
      <div className={classes.container}>
        <div className={classes.headerWrapper}>
          {(type === 'callsList' || type === 'violationsList') && (
            <DatePicker
              label={$t({ id: 'Select date' })}
              onAccept={datePickerHandler}
              selectedDate={selectedDate}
            />
          )}
          {type === 'violationsList' && (
            <AppLink href="/violations/management">
              <Button>
                <MdOutlineManageAccounts />
              </Button>
            </AppLink>
          )}
          {type === 'violationsManagement' && (
            <AppLink
              className={classes.unlockButton}
              href="/violations/management"
            >
              <Button onClick={unblockAllGreens}>
                <FaUnlock />
              </Button>
            </AppLink>
          )}
        </div>

        <div className={classes.wrapper}>
          <LangSwitcher />
          <ToggleTheme />
        </div>
      </div>

      {type !== 'settings' ? (
        <div className={classes.settingsWrapper}>
          <AppLink href={`${pathname}/settings`}>
            <FaEllipsisV />
          </AppLink>
        </div>
      ) : (
        <AppLink href={`${pathname.replace(/\/settings$/, '')}`}>
          <FaArrowLeftLong />
        </AppLink>
      )}
    </div>
  );
};

export default MobileHeader;
