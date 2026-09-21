'use client';

import { formatTime } from '@/sharedLayer/utils/date';
import { paramsToString } from '@/sharedLayer/utils/paramsToString';
import { DatePicker } from '@/sharedLayer/ui/DatePicker';
import moment from 'moment';
import 'moment/locale/uk';
import { useRouter, useSearchParams, usePathname } from '@/sharedLayer/framework/navigation';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import cn from 'classnames';
import classes from './MobileHeader.module.scss';
import { FaEllipsisV, FaSearch, FaUnlock } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

import { FaArrowLeftLong } from 'react-icons/fa6';
import { AppLink } from '@/sharedLayer/ui/AppLink';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { ToggleTheme } from '@/sharedLayer/ui/Toggle';
import { Button } from '@/sharedLayer/ui/Button';
import { MdOutlineManageAccounts } from 'react-icons/md';
import { api, useGateUsersCache } from '@/sharedLayer/api';
import { ActivityFilters } from '@/featuresLayer/ActivityLog';
import toast from 'react-hot-toast';
import { SearchField } from '@/sharedLayer/ui/SearchField';
import { settleViewportAfterKeyboard } from '@/sharedLayer/utils/settleViewport';
import { SEARCH_MODE_PARAM, SEARCH_QUERY_PARAM, useListSearch } from '@/sharedLayer/lib/search';

export const getFromToFromDataPicker = (date: string | null) => {
  const from = moment(date, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (zz)').format(
    'YYYY-MM-DD 00:00:00',
  );
  const to = moment(date, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ (zz)').format(
    'YYYY-MM-DD 23:59:59',
  );
  return { from, to };
};

const TIME_NOW = moment();
const START_OF_THE_DAY = formatTime(Date.now(), true);

const MobileHeader = ({
  title,
  type,
}: {
  title?: string;
  type:
    | 'usersList'
    | 'callsList'
    | 'violationsList'
    | 'settings'
    // like 'settings' (no footer, a back arrow), with the filters of the journals in the header
    | 'journal'
    | 'violationsManagement';
}) => {
  const { $t } = useIntl();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const from = paramsToString(searchParams.get('from')) || START_OF_THE_DAY;
  const TIME_FROM_URL = useMemo(() => moment(from), [from]);
  const [selectedDate, setSelectedDate] = useState(TIME_FROM_URL || TIME_NOW);

  const [isLoading, setIsLoading] = useState(false);
  const gateUsersCache = useGateUsersCache();

  // The lists of a day are searched from the header: the loupe turns the date field into the search field.
  const isSearchable = type === 'callsList' || type === 'violationsList';
  const search = useListSearch();
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(search.query));

  const closeSearch = () => {
    search.clear();
    setIsSearchOpen(false);
    // the field disappears together with the keyboard, without losing the focus first
    settleViewportAfterKeyboard();
  };

  const datePickerHandler = (value: string | null) => {
    const { from, to } = getFromToFromDataPicker(value);
    // the person who is looked for stays the same on another day
    const kept = [SEARCH_QUERY_PARAM, SEARCH_MODE_PARAM]
      .map((name) => [name, searchParams.get(name)])
      .filter(([, kept]) => kept)
      .map(([name, kept]) => `&${name}=${encodeURIComponent(kept!)}`)
      .join('');

    router.push(
      type === 'callsList'
        ? `/calls?from=${from}&to=${to}${kept}`
        : `/violations?from=${from}&to=${to}${kept}`,
    );
  };

  const unblockAllGreens = async () => {
    setIsLoading(true);
    api
      .unblockExpiredPenalties()
      .then((response) => {
        toast.success(response.message);
        gateUsersCache.refresh();
      })
      .catch(() => toast.error($t({ id: 'something went wrong' })))
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className={classes.header}>
      <div
        className={cn(classes.container, {
          [classes.wideContainer]: type === 'journal',
          [classes.searchContainer]: isSearchable,
        })}
      >
        {type === 'journal' && <ActivityFilters />}
        {isSearchable && isSearchOpen && (
          <div className={classes.searchWrapper}>
            <SearchField
              value={search.text}
              mode={search.mode}
              onChange={search.setQuery}
              onModeChange={search.setMode}
              autoFocus
            />
            <button type="button" className={classes.iconButton} onClick={closeSearch} aria-label={$t({ id: 'search: close' })}>
              <MdClose />
            </button>
          </div>
        )}
        <div
          className={cn(classes.headerWrapper, {
            [classes.hidden]: type === 'journal' || (isSearchable && isSearchOpen),
            [classes.withSearch]: isSearchable,
            [classes.threeItems]: type === 'violationsList',
          })}
        >
          {(type === 'callsList' || type === 'violationsList') && (
            <DatePicker
              label={$t({ id: 'Select date' })}
              onAccept={datePickerHandler}
              selectedDate={selectedDate}
            />
          )}
          {isSearchable && (
            <button type="button" className={classes.iconButton} onClick={() => setIsSearchOpen(true)} aria-label={$t({ id: 'search: open' })}>
              <FaSearch />
            </button>
          )}
          {type === 'violationsList' && (
            <AppLink href="/violations/management">
              <Button>
                <MdOutlineManageAccounts />
              </Button>
            </AppLink>
          )}
          {type === 'violationsManagement' && (
            <AppLink
              className={classes.unlockButton}
              href="/violations/management"
            >
              <Button onClick={unblockAllGreens}>
                <FaUnlock />
              </Button>
            </AppLink>
          )}
        </div>

        <div className={classes.wrapper}>
          <LangSwitcher />
          <ToggleTheme />
        </div>
      </div>

      {type !== 'settings' && type !== 'journal' ? (
        <div className={classes.settingsWrapper}>
          <AppLink href={`${pathname}/settings`}>
            <FaEllipsisV />
          </AppLink>
        </div>
      ) : (
        <AppLink href={`${pathname.replace(/\/settings$/, '')}`}>
          <FaArrowLeftLong />
        </AppLink>
      )}
    </div>
  );
};

export default MobileHeader;
