'use client';

import { Button } from '@/sharedLayer/ui/Button';
import { Pagination } from '@/sharedLayer/ui/Pagination';
import { FC, useEffect, useState } from 'react';
import { FaUserPlus } from 'react-icons/fa6';
import { useIntl } from 'react-intl';
import { UserBrowserType } from '../UserBrowser.type';
import { useSearchAndPagination } from '../lib/useSearchAndPagination';
import { Input } from '@/sharedLayer/ui/Input';
import classes from './UsersBrowser.module.scss';
import { usePathname, useRouter } from 'next/navigation';
import { AppLink } from '@/sharedLayer/ui/AppLink';
import { FaEllipsisV } from 'react-icons/fa';
import { GateUserCardsList } from '@/entitiesLayer/GateUser/ui/GateUserCardsList/GateUserCardsList';
import Popup from '@/sharedLayer/ui/Popup/ui/Popup';
import { AddGateUserForm } from '@/featuresLayer/AddGateUserForm';
import LangSwitcher from '@/sharedLayer/ui/LangSwitcher/LangSwitcher';
import { ToggleTheme } from '@/sharedLayer/ui/Toggle';

const ITEMS_PER_PAGE = 30;

export const UserBrowser: FC<UserBrowserType> = ({ users }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { $t } = useIntl();

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    router.prefetch('/users');
    router.push('/users?add=new');
    router.refresh();
  };

  const {
    page,
    searchQuery,
    paginatedData,
    searchResult,
    handlePageChange,
    handleSearchInput,
  } = useSearchAndPagination(users, ITEMS_PER_PAGE);

  return (
    <>
      <div className={classes.header}>
        <div className={classes.container}>
          <Input
            label={$t({ id: 'search' })}
            value={searchQuery}
            onChange={handleSearchInput}
          />
          <Button className="w-20 ml-2" onClick={handleOpen}>
            <FaUserPlus className="w-6 h-6" />
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
        paginatedDataLength={paginatedData.length}
        itemsPerPage={ITEMS_PER_PAGE}
        count={Math.ceil(searchResult.length / ITEMS_PER_PAGE)}
        page={page}
        onChange={handlePageChange}
        error={$t({ id: 'Unfortunately, there are no results...' })}
      />
      <Popup
        onClose={handleClose}
        isOpen={open}
        fullHeight
        fullWidth
        // className="flex items-center justify-center"
      >
        <AddGateUserForm />
      </Popup>
    </>
  );
};
