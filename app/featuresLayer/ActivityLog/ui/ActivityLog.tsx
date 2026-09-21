'use client';

import { FC, useMemo, useState } from 'react';
import moment from 'moment';
import cn from 'classnames';
import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { AccessEventDto, ActivityActorDto, ActivityEventDto } from '@/contracts';
import { ApiError, useAccessActors, useAccessLog, useActivity, useActivityActors } from '@/sharedLayer/api';
import { DatePicker } from '@/sharedLayer/ui/DatePicker';
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
  // The field always holds a date, like the calendar of the header: an empty picker drops its label into
  // the field and shows no selected day. Whether the date is applied is a separate switch.
  const [day, setDay] = useState(() => moment());
  // the latest records of all days; choosing a date in the calendar turns it off
  const [showLatest, setShowLatest] = useState(true);

  // "the 21st" is the day of the operator: its borders are computed in the time zone of the browser
  const query = useMemo(() => ({
    actor: actor === EVERYBODY ? undefined : actor,
    from: showLatest ? undefined : day.clone().startOf('day').toISOString(),
    to: showLatest ? undefined : day.clone().endOf('day').toISOString(),
  }), [actor, day, showLatest]);

  const { data: activityActors = [] } = useActivityActors();
  const { data: accessActors = [] } = useAccessActors();
  const activity = useActivity(query);
  const access = useAccessLog(query);

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
        <div className={classes.day}>
          {/* dimmed while the date is not applied, so it is clear which of the two controls rules the list */}
          <div className={cn(classes.date, { [classes.dateNotApplied]: showLatest })}>
            <DatePicker
              label={$t({ id: 'Select date' })}
              selectedDate={day}
              // the picker hands over a moment object, whatever its prop type says
              onAccept={(value) => {
                if (!value) return;
                setDay(moment(value as moment.MomentInput));
                setShowLatest(false);
              }}
            />
          </div>
          <button
            type="button"
            aria-pressed={showLatest}
            className={cn(classes.tab, { [classes.activeTab]: showLatest })}
            onClick={() => setShowLatest((latest) => !latest)}
          >
            {$t({ id: 'activity: latest' })}
          </button>
        </div>
      </div>

      <div className={classes.body}>
        {current.isLoading && <p className={classes.note}>{$t({ id: 'activity: loading' })}</p>}
        {current.error && <p className={classes.note}>{$t({ id: 'something went wrong' })}</p>}
        {current.data && current.data.length === 0 && (
          <p className={classes.note}>{$t({ id: showLatest ? 'activity: empty' : 'activity: empty day' })}</p>
        )}

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
