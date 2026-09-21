'use client';

import { FC, useEffect, useMemo } from 'react';
import moment from 'moment';
import { MenuItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { ActivityActorDto } from '@/contracts';
import { ApiError, useAccessActors, useActivityActors } from '@/sharedLayer/api';
import { DatePicker } from '@/sharedLayer/ui/DatePicker';
import { Select } from '@/sharedLayer/ui/Select';
import { EVERYBODY, useJournalFilters } from '../model/useJournalFilters';
import classes from './ActivityFilters.module.scss';

export const SYSTEM_ACTOR_ID = 'system';

const isForbidden = (error: unknown) => error instanceof ApiError && error.status === 403;

// The day and the user of the journals. Shown in the header of the journals page;
// an account that may not read the journals does not see the filters either.
export const ActivityFilters: FC = () => {
  const { $t } = useIntl();
  const { day, actor, setDay, setActor } = useJournalFilters();

  const activityActors = useActivityActors();
  const accessActors = useAccessActors();

  // somebody may have only looked around and done nothing, or the other way round
  const actors = useMemo(() => {
    const known = new Map<string, ActivityActorDto>();
    [...(activityActors.data ?? []), ...(accessActors.data ?? [])].forEach((item) => known.set(item.id, item));
    return Array.from(known.values());
  }, [activityActors.data, accessActors.data]);

  // A user from an old or mistyped link who has no records: the field would say "everybody" while the lists
  // were filtered by that user and stayed empty. The address is corrected once the users are known.
  const actorsAreKnown = Boolean(activityActors.data && accessActors.data);
  const isUnknownActor = actorsAreKnown && actor !== EVERYBODY && !actors.some((item) => item.id === actor);

  useEffect(() => {
    if (isUnknownActor) setActor(EVERYBODY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnknownActor]);

  if (isForbidden(activityActors.error) || isForbidden(accessActors.error)) return null;

  return (
    <div className={classes.filters}>
      <div className={classes.date}>
        <DatePicker
          label={$t({ id: 'Select date' })}
          selectedDate={day}
          // the picker hands over a moment object, whatever its prop type says
          onAccept={(value) => value && setDay(moment(value as moment.MomentInput))}
        />
      </div>
      <Select
        label={$t({ id: 'activity: filter by user' })}
        // until the users are loaded the list has no such option yet
        value={actors.some((item) => item.id === actor) ? actor : EVERYBODY}
        onChange={(event) => setActor(event.target.value)}
      >
        <MenuItem value={EVERYBODY}>{$t({ id: 'activity: everybody' })}</MenuItem>
        {actors.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {item.id === SYSTEM_ACTOR_ID ? $t({ id: 'activity actor: system' }) : item.name}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};
