'use client';

import { Button } from '@/sharedLayer/ui/Button';
import { Pagination } from '@/sharedLayer/ui/Pagination';
import { FC } from 'react';
import { FaUserPlus } from 'react-icons/fa6';
import { useIntl } from 'react-intl';
import { UserBrowserType } from '../UserBrowser.type';
import { useSearchAndPagination } from '../lib/useSearchAndPagination';
import { Input } from '@/sharedLayer/ui/Input';
import classes from './UsersBrowser.module.scss';
import { usePathname } from 'next/navigation';
import { AppLink } from '@/sharedLayer/ui/AppLink';
import { FaEllipsisV } from 'react-icons/fa';
import { GateUserCardsList } from '@/entitiesLayer/GateUser/ui/GateUserCardsList/GateUserCardsList';

const ITEMS_PER_PAGE = 30;

export const UserBrowser: FC<UserBrowserType> = ({ users }) => {
  const pathname = usePathname();
  const { $t } = useIntl();

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
            label="Search"
            value={searchQuery}
            onChange={handleSearchInput}
          />
          <Button className="w-20 ml-2">
            <FaUserPlus className="w-6 h-6" />
          </Button>
        </div>
        <AppLink href={`${pathname}/settings`}>
          <FaEllipsisV />
        </AppLink>
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
    </>
  );
};
