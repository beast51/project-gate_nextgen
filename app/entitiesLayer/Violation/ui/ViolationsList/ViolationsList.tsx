// 'use client';

import { formatTime } from '@/sharedLayer/utils/date';
import { useSearchParams } from '@/sharedLayer/framework/navigation';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { useViolations, useViolationStats } from '@/sharedLayer/api';
import { ViolationsCard } from '../ViolationsCard/ViolationsCard';
import classes from './ViolationsList.module.scss';
import { useIntl } from 'react-intl';

const START_OF_THE_DAY = formatTime(Date.now(), true);
const DATE_AND_TIME_NOW = formatTime(Date.now(), false);

export const ViolationsList = () => {
  const { $t } = useIntl();
  const searchParams = useSearchParams();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const to = paramsToString(searchParams.get('to')) || DATE_AND_TIME_NOW;

  const { data: violations, isLoading } = useViolations({ from, to });

  // the statistics are counted around the day chosen in the calendar
  const { data: history } = useViolationStats({ day: from.slice(0, 10) });
  const missingDays = history?.coverage.missingDays.length ?? 0;

  if (isLoading) {
    return <p className="m-4">{$t({ id: 'the visitor list is loading' })}</p>;
  }

  return (
    <>
      {violations && JSON.stringify(violations) !== '{}' ? (
        <div className={classes.list}>
          {missingDays > 0 && (
            <p className={classes.note}>
              {$t({ id: 'violation stats are incomplete' }, { days: missingDays })}
            </p>
          )}
          {violations &&
            Object.entries(violations).map(([key, violation]) => {
              return (
                <ViolationsCard
                  key={key}
                  phoneNumberOrApartment={key}
                  violation={violation}
                  stats={history && (history.stats[key] ?? null)}
                />
              );
            })}
        </div>
      ) : (
        <p className="m-4">
          {$t({ id: 'there were no visitors on this date' })}
        </p>
      )}
    </>
  );
};
