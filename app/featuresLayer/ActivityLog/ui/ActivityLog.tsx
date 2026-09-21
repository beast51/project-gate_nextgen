'use client';

import { FC, useMemo, useState } from 'react';
import moment from 'moment';
import cn from 'classnames';
import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { AccessEventDto, ActivityActorDto, ActivityEventDto } from '@/contracts';
import { ApiError, useAccessActors, useAccessLog, useActivity, useActivityActors } from '@/sharedLayer/api';
import { Select } from '@/sharedLayer/ui/Select';
import { formatPhoneNumber } from '@/sharedLayer/utils/formatPhoneNumber';
import classes from './ActivityLog.module.scss';

const EVERYBODY = 'everybody';
const SYSTEM_ACTOR_ID = 'system';

type Tab = 'actions' | 'access'

const isForbidden = (error: unknown) => error instanceof ApiError && error.status === 403;

// the journals keep UTC, the operator sees the time of their own time zone
const formatTime = (at: string) => moment(at).format('DD.MM.YYYY HH:mm:ss');

// What the operators did and when they were in the application, with one filter by the account.
// An account that may not read the journals sees nothing at all.
export const ActivityLog: FC = () => {
  const { $t } = useIntl();
  const [tab, setTab] = useState<Tab>('actions');
  const [actor, setActor] = useState(EVERYBODY);
  const selectedActor = actor === EVERYBODY ? undefined : actor;

  const { data: activityActors = [] } = useActivityActors();
  const { data: accessActors = [] } = useAccessActors();
  const activity = useActivity({ actor: selectedActor });
  const access = useAccessLog({ actor: selectedActor });

  // somebody may have only looked around and done nothing, or the other way round
  const actors = useMemo(() => {
    const known = new Map<string, ActivityActorDto>();
    [...activityActors, ...accessActors].forEach((item) => known.set(item.id, item));
    return Array.from(known.values());
  }, [activityActors, accessActors]);

  if (isForbidden(activity.error) || isForbidden(access.error)) return null;

  const actorName = ({ id, name }: ActivityActorDto) =>
    id === SYSTEM_ACTOR_ID ? $t({ id: 'activity actor: system' }) : name;

  const current = tab === 'actions' ? activity : access;

  return (
    <section className={classes.activity}>
      <div className={classes.header}>
        <div className={classes.tabs} role="tablist">
          {(['actions', 'access'] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={cn(classes.tab, { [classes.activeTab]: tab === item })}
              onClick={() => setTab(item)}
            >
              {$t({ id: `activity tab: ${item}` })}
            </button>
          ))}
        </div>
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

      <div className={classes.body}>
        {current.isLoading && <p className={classes.note}>{$t({ id: 'activity: loading' })}</p>}
        {current.error && <p className={classes.note}>{$t({ id: 'something went wrong' })}</p>}
        {current.data && current.data.length === 0 && <p className={classes.note}>{$t({ id: 'activity: empty' })}</p>}

        <ul className={classes.list}>
          {tab === 'actions'
            ? activity.data?.map((event) => <ActionItem key={event.id} event={event} actorName={actorName(event.actor)} />)
            : access.data?.map((event) => <AccessItem key={event.id} event={event} actorName={actorName(event.actor)} />)}
        </ul>

        {tab === 'access' && <p className={classes.note}>{$t({ id: 'access: retention' })}</p>}
      </div>
    </section>
  );
};

const ActionItem: FC<{ event: ActivityEventDto, actorName: string }> = ({ event, actorName }) => {
  const { $t } = useIntl();
  const { details, subjects } = event;

  return (
    <li className={classes.item}>
      <div className={classes.itemHeader}>
        <time dateTime={event.at}>{formatTime(event.at)}</time>
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

const AccessItem: FC<{ event: AccessEventDto, actorName: string }> = ({ event, actorName }) => {
  const { $t } = useIntl();

  return (
    <li className={cn(classes.item, { [classes.signIn]: event.kind === 'signIn' })}>
      <div className={classes.itemHeader}>
        <time dateTime={event.at}>{formatTime(event.at)}</time>
        <span className={classes.actor}>{actorName}</span>
      </div>

      <p className={classes.action}>
        {event.kind === 'signIn' ? $t({ id: 'access: signed in' }) : event.path}
      </p>

      <p className={classes.details}>
        {[event.ip || $t({ id: 'access: unknown address' }), event.device].filter(Boolean).join(' · ')}
      </p>
    </li>
  );
};
