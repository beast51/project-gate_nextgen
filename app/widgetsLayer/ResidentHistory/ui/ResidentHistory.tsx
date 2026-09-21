'use client';

import { FC } from 'react';
import { useIntl } from 'react-intl';
import { useViolationHistory, useViolationStats } from '@/sharedLayer/api';
import { formatTime } from '@/sharedLayer/utils/date';
import { PenaltyHistory, ViolationHistory, ViolationStats } from '@/entitiesLayer/Violation';
import classes from './ResidentHistory.module.scss';

type ResidentHistoryProps = {
  // the apartment number or, for a caller without an apartment, the phone number
  subject: string;
};

// What the apartment of a gate user has done in the last three months and how it was punished.
// Always counted from today, whatever day the calendar of the lists is on.
export const ResidentHistory: FC<ResidentHistoryProps> = ({ subject }) => {
  const { $t } = useIntl();
  const { data: history, error } = useViolationHistory({ subject });
  const { data: stats } = useViolationStats({ day: formatTime(Date.now()).slice(0, 10) });

  if (error) return <p className={classes.note}>{$t({ id: 'something went wrong' })}</p>;
  if (!history) return <p className={classes.note}>{$t({ id: 'resident history: loading' })}</p>;

  return (
    <div className={classes.history}>
      <section className={classes.section}>
        <h2 className={classes.title}>{$t({ id: 'resident history: violations title' })}</h2>
        {stats?.stats[subject] && <ViolationStats stats={stats.stats[subject]} openVisitsLabelId="violation: tailgating" />}
        <ViolationHistory violations={history.violations} />
      </section>

      <section className={classes.section}>
        <h2 className={classes.title}>{$t({ id: 'resident history: penalties title' })}</h2>
        <PenaltyHistory penalties={history.penalties} />
      </section>
    </div>
  );
};
