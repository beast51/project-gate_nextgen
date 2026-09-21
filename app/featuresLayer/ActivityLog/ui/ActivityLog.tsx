'use client';

import { FC, useState } from 'react';
import moment from 'moment';
import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { ActivityActorDto, ActivityEventDto } from '@/contracts';
import { ApiError, useActivity, useActivityActors } from '@/sharedLayer/api';
import { Select } from '@/sharedLayer/ui/Select';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import classes from './ActivityLog.module.scss';

const EVERYBODY = 'everybody';
const SYSTEM_ACTOR_ID = 'system';

// The last actions of the operators with a filter by the account.
// An account that may not read the journal sees nothing at all.
export const ActivityLog: FC = () => {
  const { $t } = useIntl();
  const [actor, setActor] = useState(EVERYBODY);

  const { data: actors = [] } = useActivityActors();
  const { data: events, error, isLoading } = useActivity({ actor: actor === EVERYBODY ? undefined : actor });

  if (error instanceof ApiError && error.status === 403) return null;

  const actorName = ({ id, name }: ActivityActorDto) =>
    id === SYSTEM_ACTOR_ID ? $t({ id: 'activity actor: system' }) : name;

  return (
    <section className={classes.activity}>
      <div className={classes.header}>
        <h2 className={classes.title}>{$t({ id: 'activity: title' })}</h2>
        <Select
          label={$t({ id: 'activity: filter by user' })}
          value={actor}
          onChange={(event) => setActor(event.target.value)}
        >
          <MenuItem value={EVERYBODY}>{$t({ id: 'activity: everybody' })}</MenuItem>
          {actors.map((item) => (
            <MenuItem key={item.id} value={item.id}>{actorName(item)}</MenuItem>
          ))}
        </Select>
      </div>

      {isLoading && <p className={classes.note}>{$t({ id: 'activity: loading' })}</p>}
      {error && <p className={classes.note}>{$t({ id: 'something went wrong' })}</p>}
      {events && events.length === 0 && <p className={classes.note}>{$t({ id: 'activity: empty' })}</p>}

      <ul className={classes.list}>
        {events?.map((event) => (
          <ActivityItem key={event.id} event={event} actorName={actorName(event.actor)} />
        ))}
      </ul>
    </section>
  );
};

const ActivityItem: FC<{ event: ActivityEventDto, actorName: string }> = ({ event, actorName }) => {
  const { $t } = useIntl();
  const { details, subjects } = event;

  return (
    <li className={classes.item}>
      <div className={classes.itemHeader}>
        {/* the journal keeps UTC, the operator sees the time of their own time zone */}
        <time dateTime={event.at}>{moment(event.at).format('DD.MM.YYYY HH:mm:ss')}</time>
        <span className={classes.actor}>{actorName}</span>
      </div>

      <p className={classes.action}>{$t({ id: `activity action: ${event.action}` })}</p>

      {subjects.map((subject) => (
        <p key={subject.phoneNumber} className={classes.subject}>
          {[
            subject.name,
            subject.apartmentNumber && `${$t({ id: 'apt' })}${subject.apartmentNumber}`,
            formatPhoneNumber(subject.phoneNumber),
            subject.carNumber.join(', '),
          ].filter(Boolean).join(' · ')}
        </p>
      ))}

      {details.blockedUntil && (
        <p className={classes.details}>
          {$t({ id: 'activity: blocked until' })} {moment(details.blockedUntil, 'YYYY-MM-DD HH:mm:ss').format('DD.MM.YYYY HH:mm')}
        </p>
      )}
      {details.changedFields && details.changedFields.length > 0 && (
        <p className={classes.details}>
          {$t({ id: 'activity: changed' })}{' '}
          {details.changedFields.map((field) => $t({ id: `activity field: ${field}` })).join(', ')}
        </p>
      )}
      {details.added !== undefined && (
        <p className={classes.details}>
          {$t({ id: 'activity: added of received' }, { added: details.added, received: details.received ?? details.added })}
        </p>
      )}
    </li>
  );
};
