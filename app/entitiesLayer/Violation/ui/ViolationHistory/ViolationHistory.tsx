'use client';

import { FC, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { SubjectViolationDto } from '@/contracts';
import { StayTimerCard } from '../StayTimerCard';
import classes from './ViolationHistory.module.scss';

type ViolationHistoryProps = {
  // the newest first
  violations: SubjectViolationDto[];
};

// a long history opens by this many days
const DAYS_AT_ONCE = 10;

// '2026-09-21' -> '21.09.2026'
const formatDay = (day: string) => day.split('-').reverse().join('.');

// The violations of an apartment day by day, as the same cards the violations page shows
export const ViolationHistory: FC<ViolationHistoryProps> = ({ violations }) => {
  const { $t } = useIntl();
  const [shownDays, setShownDays] = useState(DAYS_AT_ONCE);

  const days = useMemo(() => {
    const byDay = new Map<string, SubjectViolationDto[]>();
    violations.forEach((violation) => byDay.set(violation.day, [...(byDay.get(violation.day) ?? []), violation]));
    // within a day in the order they happened, like on the violations page
    return Array.from(byDay, ([day, items]) => ({ day, items: [...items].sort((a, b) => a.timeIn.localeCompare(b.timeIn)) }));
  }, [violations]);

  if (days.length === 0) {
    return <p className={classes.none}>{$t({ id: 'resident history: no violations' })}</p>;
  }

  return (
    <div className={classes.history}>
      {days.slice(0, shownDays).map(({ day, items }) => (
        <section key={day} className={classes.day}>
          <h3 className={classes.date}>{formatDay(day)}</h3>
          <div className={classes.visits}>
            {items.map((violation) => (
              <StayTimerCard
                key={violation.timeIn}
                isOverstay
                // An unpaired passage of a finished day: the car got in or out behind somebody else, without a call.
                // The list of a day shows '?', because there the visit may still be closed.
                openLabel={$t({ id: 'violation: tailgating' })}
                visit={{
                  timeIn: violation.timeIn,
                  timeOut: violation.timeOut,
                  thisVisitTime: violation.minutes,
                  violationTime: violation.minutes,
                  violation: '',
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {days.length > shownDays && (
        <button type="button" className={classes.more} onClick={() => setShownDays(shownDays + DAYS_AT_ONCE)}>
          {$t({ id: 'resident history: show more' }, { days: days.length - shownDays })}
        </button>
      )}
    </div>
  );
};
