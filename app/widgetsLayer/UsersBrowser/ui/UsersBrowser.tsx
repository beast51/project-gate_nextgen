'use client';

import { Button } from '@/sharedLayer/ui/Button';
import { Pagination } from '@/sharedLayer/ui/Pagination';
import { FC, useState } from 'react';
import { FaUserPlus } from 'react-icons/fa6';
import { useIntl } from 'react-intl';
import { UserBrowserType } from '../UserBrowser.type';
import { useSearchAndPagination } from '../lib/useSearchAndPagination';
import { SearchField } from '@/sharedLayer/ui/SearchField';
import { useListSearch } from '@/sharedLayer/lib/search';
import classes from './UsersBrowser.module.scss';
import { usePathname } from '@/sharedLayer/framework/navigation';
import { useGateUsers, useGateUsersCache } from '@/sharedLayer/api';
import { AppLink } from '@/sharedLayer/ui/AppLink';
import { FaEllipsisV } from 'react-icons/fa';
import { GateUserCardsList } from '@/entitiesLayer/GateUser/ui/GateUserCardsList/GateUserCardsList';
import Popup from '@/sharedLayer/ui/Popup/ui/Popup';
import { AddGateUserForm } from '@/featuresLayer/AddGateUserForm';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { ToggleTheme } from '@/sharedLayer/ui/Toggle';

const ITEMS_PER_PAGE = 30;

export const UserBrowser: FC<UserBrowserType> = ({ users: initialUsers }) => {
  const pathname = usePathname();
  const { $t } = useIntl();
  // the page arrives with the list already rendered, later the list is refreshed without reloading the page
  const { data: users = initialUsers } = useGateUsers({}, initialUsers);
  const gateUsersCache = useGateUsersCache();

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    gateUsersCache.refresh();
  };

  const search = useListSearch();

  const {
    page,
    paginatedData,
    searchResult,
    handlePageChange,
  } = useSearchAndPagination(users, ITEMS_PER_PAGE, search.query, search.mode);

  return (
    <>
      <div className={classes.header}>
        <div className={classes.container}>
          <SearchField
            value={search.text}
            mode={search.mode}
            onChange={search.setQuery}
            onModeChange={search.setMode}
          />
          <Button onClick={handleOpen}>
            <FaUserPlus />
          </Button>
        </div>
        <div className={classes.settingsWrapper}>
          <AppLink href={`${pathname}/settings`}>
            <FaEllipsisV />
          </AppLink>
        </div>
        <div className={classes.wrapper}>
          <LangSwitcher />
          <ToggleTheme />
        </div>
      </div>
      <GateUserCardsList users={paginatedData} />
      <Pagination
        paginatedDataLength={paginatedData?.length}
        itemsPerPage={ITEMS_PER_PAGE}
        count={Math.ceil(searchResult.length / ITEMS_PER_PAGE)}
        page={page}
        onChange={handlePageChange}
        error={$t({ id: 'Unfortunately, there are no results...' })}
      />
      <Popup onClose={handleClose} isOpen={open} fullHeight fullWidth>
        <AddGateUserForm />
      </Popup>
    </>
  );
};
