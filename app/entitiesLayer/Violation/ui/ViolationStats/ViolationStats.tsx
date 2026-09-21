import { FC, memo } from 'react';
import { useIntl } from 'react-intl';
import cn from 'classnames';
import { ViolationStatsDto } from '@/contracts';
import classes from './ViolationStats.module.scss';

export type ViolationStatsType = ViolationStatsDto;

type ViolationStatsProps = {
  // null: the visitor has no violations in any of the periods
  stats: ViolationStatsType | null;
};

const PERIODS = [
  ['week', 'violation stats week'],
  ['month', 'violation stats month'],
  ['threeMonths', 'violation stats three months'],
] as const;

// from this number on a count is shown in red, like an overstayed visit; below it in the green of the card
const MANY = 3;

const KINDS = [
  ['overstays', 'violation stats overstays'],
  ['openVisits', 'violation stats open visits'],
  ['penalties', 'violation stats penalties'],
] as const;

// Violations of the visitor around the chosen day: the week, the month and three months,
// overstays and visits without an exit apart, and how many times it ended with a penalty
export const ViolationStats: FC<ViolationStatsProps> = memo(({ stats }) => {
  const { $t } = useIntl();

  if (!stats) {
    return <p className={classes.none}>{$t({ id: 'violation stats none' })}</p>;
  }

  return (
    <div className={classes.stats} role="table" aria-label={$t({ id: 'violation stats title' })}>
      <div className={classes.row} role="row">
        <span role="columnheader" />
        {PERIODS.map(([period, label]) => (
          <span key={period} className={classes.period} role="columnheader">{$t({ id: label })}</span>
        ))}
      </div>
      {KINDS.map(([kind, label]) => (
        <div key={kind} className={classes.row} role="row">
          <span className={classes.kind} role="rowheader">{$t({ id: label })}</span>
          {PERIODS.map(([period]) => (
            <span
              key={period}
              role="cell"
              className={cn(classes.count, {
                [classes.zero]: stats[period][kind] === 0,
                [classes.many]: stats[period][kind] >= MANY,
              })}
            >
              {stats[period][kind]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
});

ViolationStats.displayName = 'ViolationStats';
