'use client';

import { useCallback, useMemo } from 'react';
import moment from 'moment';
import { usePathname, useRouter, useSearchParams } from '@/sharedLayer/framework/navigation';

export const EVERYBODY = 'everybody';

const DAY_PARAM = 'day';
const USER_PARAM = 'user';
const DAY_FORMAT = 'YYYY-MM-DD';

// The filters of the journals live in the address of the page, like the date of the calls and the violations:
// the fields sit in the header, the lists in the page, and a link to "what Olga did on the 19th" can be shared.
export const useJournalFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dayParam = searchParams.get(DAY_PARAM);
  const actor = searchParams.get(USER_PARAM) || EVERYBODY;

  // today unless the address names a real day
  const day = useMemo(() => {
    const parsed = moment(dayParam, DAY_FORMAT, true);
    return parsed.isValid() ? parsed : moment().startOf('day');
  }, [dayParam]);

  const update = useCallback((next: { day?: moment.Moment, actor?: string }) => {
    const params = new URLSearchParams();
    const nextDay = next.day ?? day;
    const nextActor = next.actor ?? actor;

    if (!nextDay.isSame(moment(), 'day')) params.set(DAY_PARAM, nextDay.format(DAY_FORMAT));
    if (nextActor !== EVERYBODY) params.set(USER_PARAM, nextActor);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, day, actor]);

  // "the 21st" is the day of the operator: its borders are computed in the time zone of the browser
  const query = useMemo(() => ({
    actor: actor === EVERYBODY ? undefined : actor,
    from: day.clone().startOf('day').toISOString(),
    to: day.clone().endOf('day').toISOString(),
  }), [actor, day]);

  return {
    day,
    actor,
    query,
    setDay: (value: moment.Moment) => update({ day: value }),
    setActor: (value: string) => update({ actor: value }),
  };
};
