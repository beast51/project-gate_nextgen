'use client';

import { FC } from 'react';
import { useIntl } from 'react-intl';
import cn from 'classnames';
import { PenaltyDto } from '@/contracts';
import classes from './PenaltyHistory.module.scss';

type PenaltyHistoryProps = {
  // the newest first
  penalties: PenaltyDto[];
};

// '2026-09-10 07:36:45' -> '10.09.2026 07:36'
const formatTime = (time: string) => {
  const [day, clock = ''] = time.split(' ');
  return `${day.split('-').reverse().join('.')} ${clock.slice(0, 5)}`.trim();
};

// by the calendar: blocked on the 10th until the 18th is 8 days, whatever the hours are
const daysBetween = (from: string, until: string) =>
  Math.max(1, Math.round((Date.parse(`${until.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / 86_400_000));

// The penalties of an apartment: when, for how long, why (the ground and the words of the operator)
// and how each of them ended
export const PenaltyHistory: FC<PenaltyHistoryProps> = ({ penalties }) => {
  const { $t } = useIntl();
  // a ground is stored as a code; one that this version does not know is shown as it is
  const groundText = (ground: string | null) =>
    ground && $t({ id: `penalty ground: ${ground}`, defaultMessage: ground });

  if (penalties.length === 0) {
    return <p className={classes.none}>{$t({ id: 'resident history: no penalties' })}</p>;
  }

  return (
    <ul className={classes.list}>
      {penalties.map((penalty) => {
        const ground = groundText(penalty.ground);
        const liftGround = groundText(penalty.lifted?.ground ?? null);

        return (
          <li key={penalty.id} className={cn(classes.penalty, { [classes.inForce]: !penalty.lifted })}>
            <div className={classes.head}>
              <span className={classes.term}>
                {formatTime(penalty.from)} → {formatTime(penalty.until)}
              </span>
              <span className={classes.days}>{$t({ id: 'resident history: days' }, { days: daysBetween(penalty.from, penalty.until) })}</span>
            </div>

            <p className={classes.state}>
              {!penalty.lifted && $t({ id: 'resident history: in force' })}
              {penalty.lifted?.how === 'expired' && $t({ id: 'resident history: term is over' })}
              {penalty.lifted?.how === 'manually' && $t({ id: 'resident history: lifted early' }, { at: formatTime(penalty.lifted.at) })}
              {penalty.lifted?.how === 'manually' && (liftGround || penalty.lifted.comment) && (
                <> — {[liftGround, penalty.lifted.comment].filter((text, index, all) => text && all.indexOf(text) === index).join('. ')}</>
              )}
            </p>

            {(ground || penalty.comment) && (
              <p className={classes.line}>
                <span className={classes.label}>{$t({ id: 'resident history: ground' })}</span>{' '}
                {/* a ready-made ground writes its own words into the comment: they are not repeated */}
                {penalty.comment && ground && penalty.comment.includes(ground) ? penalty.comment : [ground, penalty.comment].filter(Boolean).join('. ')}
              </p>
            )}

            <p className={classes.meta}>
              {penalty.isRecorded
                ? penalty.imposedBy && $t({ id: 'resident history: imposed by' }, { name: penalty.imposedBy })
                : $t({ id: 'resident history: restored' })}
            </p>
          </li>
        );
      })}
    </ul>
  );
};
